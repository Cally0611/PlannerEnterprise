import React from 'react';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 34, height: 34,
      background: 'var(--accent)',
      borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
        <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" />
        <path d="M2 7l8 5 8-5" />
        <path d="M10 12v8" />
      </svg>
    </div>
    <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.3px', color: '#1a1a18' }}>
      Vault
    </span>
  </div>
);

export default Logo;
