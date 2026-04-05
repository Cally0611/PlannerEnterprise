import React from 'react';

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FileItem = ({ file, onRemove, disabled }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#f1efe8',
    border: '0.5px solid #d3d1c7',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    fontSize: 13,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: 'var(--accent-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 500, color: '#1a1a18', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {file.name}
      </div>
      <div style={{ fontSize: 11, color: '#888780', fontFamily: 'var(--mono)', marginTop: 1 }}>
        {formatSize(file.size)}
      </div>
    </div>
    <button
      onClick={() => onRemove(file.id)}
      disabled={disabled}
      title="Remove"
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        color: '#888780', padding: 4, borderRadius: 4,
        fontSize: 18, lineHeight: 1, opacity: disabled ? 0.4 : 1,
        transition: 'color 0.12s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = '#A32D2D'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#888780'; }}
    >
      ×
    </button>
  </div>
);

export default FileItem;
