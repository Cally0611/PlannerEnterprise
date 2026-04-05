import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const useAnalysis = () => {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const analyse = useCallback(async (file) => {
    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/analysis`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Server error: ${res.status}`);
      }

      setResult(data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message ?? 'Analysis failed.');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  }, []);

  return { result, status, errorMsg, analyse, reset };
};

export default useAnalysis;
