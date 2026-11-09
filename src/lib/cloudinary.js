export const sanitizeMediaUrl = (url) => {
    if (!url || typeof url !== 'string')
        return null;
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('http:')) {
        cleanUrl = cleanUrl.replace(/^http:/, 'https:');
    }
    return cleanUrl.replace('res.cloudinary.com/lrlxkpeix/', 'res.cloudinary.com/rlxkpeix/');
};
export const uploadToCloudinary = async (file, resourceType = 'auto', onProgress = null) => {
    if (!file)
        return null;
    if (typeof file === 'string')
        return file;
    const rawCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rlxkpeix';
    const cloudName = rawCloudName.replace(/["'\r\n]/g, '').trim();
    const rawPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'profil_video';
    const uploadPreset = rawPreset.replace(/["'\r\n]/g, '').trim();
    let targetType = 'auto';
    if (resourceType && resourceType !== 'auto') {
        targetType = resourceType;
    }
    else if (file.type) {
        if (file.type.startsWith('video/'))
            targetType = 'video';
        else if (file.type.startsWith('image/'))
            targetType = 'image';
        else
            targetType = 'raw';
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${targetType}/upload`;
    return new Promise((resolve, reject) => {
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
            let data = {};
            try {
                data = JSON.parse(xhr.responseText);
            }
            catch (e) { }
            if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                if (onProgress)
                    onProgress(100);
                resolve(data.secure_url);
            }
            else {
                const msg = data.error?.message || `Erreur Cloudinary (${xhr.status})`;
                reject(new Error(msg));
            }
        };
        xhr.onerror = () => {
            fetch(endpoint, { method: 'POST', body: formData })
                .then(async (res) => {
                const data = await res.json();
                if (res.ok && data.secure_url) {
                    if (onProgress)
                        onProgress(100);
                    resolve(data.secure_url);
                }
                else {
                    reject(new Error(data.error?.message || `Erreur Cloudinary (${res.status})`));
                }
            })
                .catch((err) => {
                reject(new Error('Erreur de téléversement : ' + (err.message || 'Impossible de contacter le serveur.')));
            });
        };
        xhr.send(formData);
    });
};
export const getCloudinaryDownloadUrl = (url) => {
    if (!url)
        return '#';
    if (url.includes('res.cloudinary.com') && !url.includes('fl_attachment')) {
        if (url.includes('/raw/upload/')) {
            return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
        }
        if (url.includes('/upload/')) {
            return url.replace('/upload/', '/upload/fl_attachment/');
        }
    }
    return url;
};
