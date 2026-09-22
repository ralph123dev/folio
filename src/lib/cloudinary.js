/**
 * Helper d'upload pour Cloudinary utilisant la signature API SHA-1 et XMLHttpRequest
 * Permet le téléversement direct et la progression réelle (0% à 100%) des vidéos et CVs
 */
async function sha1Hex(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const uploadToCloudinary = async (file, resourceType = 'auto', onProgress = null) => {
  if (!file) return null;
  if (typeof file === 'string') return file; // Si c'est déjà une URL ou une chaîne

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'lrlxkpeix';
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '927489433532747';
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'dVwY0LpOU4lZ8A-xuZNl-ebWFjg';

  let targetType = resourceType;
  if (resourceType === 'auto') {
    if (file.type.startsWith('video/')) {
      targetType = 'video';
    } else if (file.type.startsWith('image/')) {
      targetType = 'image';
    } else {
      targetType = 'raw';
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1Hex(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${targetType}/upload`;

    xhr.open('POST', endpoint);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            if (onProgress) onProgress(100);
            resolve(data.secure_url);
          } else {
            reject(new Error(data.error?.message || 'Upload échoué.'));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error?.message || `Erreur Cloudinary (${xhr.status})`));
        } catch {
          reject(new Error(`Erreur serveur Cloudinary (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erreur de connexion réseau lors de l\'envoi vers Cloudinary.'));
    xhr.send(formData);
  });
};

/**
 * Génère une URL d'attachement Cloudinary pour forcer le téléchargement direct des fichiers CV.
 * Gère à la fois les uploads image/video (/upload/) et les uploads raw (/raw/upload/).
 */
export const getCloudinaryDownloadUrl = (url) => {
  if (!url) return '#';
  
  // Si c'est une URL Cloudinary et qu'on n'a pas déjà fl_attachment
  if (url.includes('res.cloudinary.com') && !url.includes('fl_attachment')) {
    // Pour les fichiers raw : /raw/upload/v1234/file.pdf
    if (url.includes('/raw/upload/')) {
      return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
    }
    // Pour les fichiers image/video : /upload/v1234/file.mp4
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
  }
  
  // Pour les URLs non-Cloudinary, retourner directement
  return url;
};
