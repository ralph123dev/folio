/**
 * Helper d'upload pour Cloudinary utilisant la signature API SHA-1 et XMLHttpRequest
 * Permet le téléversement direct et la progression réelle (0% à 100%) des vidéos et CVs
 */
export const sanitizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('http:')) {
    cleanUrl = cleanUrl.replace(/^http:/, 'https:');
  }
  return cleanUrl.replace('res.cloudinary.com/lrlxkpeix/', 'res.cloudinary.com/rlxkpeix/');
};

export const uploadToCloudinary = async (file, resourceType = 'auto', onProgress = null) => {
  if (!file) return null;
  if (typeof file === 'string') return file; // Si c'est déjà une URL ou une chaîne

  const rawCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rlxkpeix';
  const cloudName = rawCloudName.replace(/["'\r\n]/g, '').trim();
  const rawPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'profil_video';
  const uploadPreset = rawPreset.replace(/["'\r\n]/g, '').trim();

  let targetType = resourceType;
  if (resourceType === 'auto') {
    if (file.type && file.type.startsWith('video/')) {
      targetType = 'video';
    } else if (file.type && file.type.startsWith('image/')) {
      targetType = 'image';
    } else {
      targetType = 'raw';
    }
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${targetType}/upload`;

  try {
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
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

      xhr.onerror = () => reject(new Error('XHR_NET_ERROR'));
      xhr.send(formData);
    });
  } catch (err) {
    if (err.message === 'XHR_NET_ERROR') {
      try {
        const resp = await fetch(endpoint, { method: 'POST', body: formData });
        const data = await resp.json();
        if (resp.ok && data.secure_url) {
          if (onProgress) onProgress(100);
          return data.secure_url;
        }
        throw new Error(data.error?.message || `Erreur Cloudinary (${resp.status})`);
      } catch (fetchErr) {
        console.error('Échec envoi Cloudinary via fetch:', fetchErr);
        throw new Error('Impossible de contacter Cloudinary. Vérifiez votre connexion internet ou désactivez votre bloqueur de publicité (AdBlock/Brave).');
      }
    }
    throw err;
  }
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
