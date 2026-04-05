import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const useUpload = () => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      name: f.name,
      size: f.size,
    }));
    setFiles(prev => {
      const existingIds = new Set(prev.map(f => `${f.name}-${f.size}`));
      const unique = incoming.filter(f => !existingIds.has(`${f.name}-${f.size}`));
      return [...prev, ...unique];
    });
    setStatus('idle');
    setProgress(0);
    setUploadedFiles([]);
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setStatus('idle');
    setProgress(0);
  }, []);

  const upload = useCallback(async () => {
    if (!files.length) return;
    setStatus('uploading');
    setProgress(0);
    setUploadedFiles([]);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));

    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.floor((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try { reject(JSON.parse(xhr.responseText)); }
            catch { reject({ error: `Server error: ${xhr.status}` }); }
          }
        });

        xhr.addEventListener('error', () => reject({ error: 'Network error. Is the server running?' }));
        xhr.addEventListener('abort', () => reject({ error: 'Upload cancelled.' }));

        xhr.open('POST', `${API_BASE}/api/upload`);
        xhr.send(formData);
      });

      setUploadedFiles(result.files ?? []);
      setStatus('success');
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error');
      setProgress(0);
      throw err;
    }
  }, [files]);

  const reset = useCallback(() => {
    setFiles([]);
    setStatus('idle');
    setProgress(0);
    setUploadedFiles([]);
  }, []);

  return { files, status, progress, uploadedFiles, addFiles, removeFile, upload, reset };
};

export default useUpload;
