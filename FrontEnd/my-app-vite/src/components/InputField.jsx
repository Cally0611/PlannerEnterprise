import React, { useState } from 'react';

const InputField = ({ label, type = 'text', value, onChange, onKeyDown, placeholder, error, autoFocus }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: '#888780', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '9px 12px', fontSize: 14,
          fontFamily: 'var(--font)',
          background: '#f1efe8',
          border: `0.5px solid ${error ? '#E24B4A' : '#c4c2b8'}`,
          borderRadius: 'var(--radius-md)',
          color: '#1a1a18',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          ...(focused && !error ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px rgba(24,95,165,0.12)' } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>{error}</div>}
    </div>
  );
};

export default InputField;
