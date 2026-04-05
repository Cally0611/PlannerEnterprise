import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const useTeamsNotify = () => {
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [message, setMessage] = useState('');

  const send = useCallback(async (analysisResult) => {
    setStatus('sending');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/notify/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Server error: ${res.status}`);
      }

      setStatus('success');
      setMessage(data.message ?? 'Summary sent to Teams.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message ?? 'Failed to send to Teams.');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
  }, []);

  return { status, message, send, reset };
};

export default useTeamsNotify;
