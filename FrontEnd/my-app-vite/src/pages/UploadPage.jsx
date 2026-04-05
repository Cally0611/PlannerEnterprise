import React, { useCallback, useRef, useState } from 'react';
import Logo from '../components/Logo';
import FileItem from '../components/FileItem';
import AnalysisResult from '../components/AnalysisResult';
import useUpload from '../hooks/useUpload';
import useAnalysis from '../hooks/useAnalysis';

const ANALYSABLE = ['.csv', '.xlsx', '.xls'];

const canAnalyse = (files) =>
  files.length === 1 &&
  ANALYSABLE.some(ext => files[0].name.toLowerCase().endsWith(ext));

const UploadPage = ({ user, onLogout }) => {
  const { files, status, progress, uploadedFiles, addFiles, removeFile, upload, reset } = useUpload();
  const { result, status: analysisStatus, errorMsg: analysisError, analyse, reset: resetAnalysis } = useAnalysis();
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
    setUploadError('');
    resetAnalysis();
  }, [addFiles, resetAnalysis]);

  const handleFilesAdded = (fileList) => {
    addFiles(fileList);
    setUploadError('');
    resetAnalysis();
  };

  const handleUpload = async () => {
    setUploadError('');
    try { await upload(); } catch (err) {
      setUploadError(err?.error ?? err?.message ?? 'Upload failed.');
    }
  };

  const handleAnalyse = () => {
    if (files.length === 1) analyse(files[0].file);
  };

  const handleReset = () => {
    reset();
    resetAnalysis();
    setUploadError('');
  };

  const isUploading = status === 'uploading';
  const isUploadSuccess = status === 'success';
  const isUploadError = status === 'error';
  const isAnalysing = analysisStatus === 'loading';
  const isAnalysisSuccess = analysisStatus === 'success';

  return (
    <div style={{
      background: '#ffffff', border: '0.5px solid #d3d1c7',
      borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 780, padding: '2rem',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888780' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: 'var(--accent-text)',
          }}>
            {user.initials}
          </div>
          <span>{user.name}</span>
          <button onClick={onLogout} style={{
            fontSize: 12, color: '#888780', cursor: 'pointer', background: 'none',
            border: 'none', fontFamily: 'var(--font)', padding: '4px 8px',
            borderRadius: 'var(--radius-md)', transition: 'background 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1efe8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >Sign out</button>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: '0.35rem' }}>
        Upload &amp; analyse
      </h2>
      <p style={{ fontSize: 13, color: '#888780', marginBottom: '1.5rem' }}>
        Upload a CSV or Excel file to view its contents, or upload any supported file to store it.
      </p>

      {/* Drop zone */}
      <div
        style={{
          border: `1.5px dashed ${dragging ? 'var(--accent)' : '#c4c2b8'}`,
          borderRadius: 'var(--radius-lg)', padding: '2rem 1.5rem',
          textAlign: 'center', cursor: 'pointer', position: 'relative',
          transition: 'border-color 0.15s, background 0.15s',
          background: dragging ? 'var(--accent-bg)' : 'transparent',
        }}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple
          onChange={e => { if (e.target.files) handleFilesAdded(e.target.files); }}
          style={{ display: 'none' }}
        />
        <div style={{ margin: '0 auto 12px', width: 40, height: 40 }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none"
            stroke={dragging ? 'var(--accent)' : '#b4b2a9'}
            strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: '#1a1a18' }}>Drop files here</div>
        <div style={{ fontSize: 12, color: '#b4b2a9' }}>CSV, XLSX, XLS and other supported formats up to 50 MB</div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(f => (
            <FileItem key={f.id} file={f} onRemove={(id) => { removeFile(id); resetAnalysis(); }} disabled={isUploading || isAnalysing} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {(isUploading || isUploadSuccess) && (
        <div style={{ height: 3, background: '#d3d1c7', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
          <div style={{
            height: '100%', background: 'var(--accent)', borderRadius: 2,
            width: `${progress}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Status messages */}
      {isUploadSuccess && (
        <div style={{ fontSize: 13, textAlign: 'center', marginTop: 10, color: '#3B6D11' }}>
          {files.length} file{files.length > 1 ? 's' : ''} uploaded successfully.
        </div>
      )}
      {isUploadError && uploadError && (
        <div style={{ fontSize: 13, textAlign: 'center', marginTop: 10, color: '#A32D2D' }}>{uploadError}</div>
      )}
      {analysisError && (
        <div style={{ fontSize: 13, textAlign: 'center', marginTop: 10, color: '#A32D2D' }}>{analysisError}</div>
      )}

      {/* Action buttons */}
      {files.length > 0 && !isUploadSuccess && (
        <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
          {/* Analyse button — only for single CSV/Excel */}
          {canAnalyse(files) && (
            <button
              onClick={handleAnalyse}
              disabled={isAnalysing || isUploading}
              style={{
                flex: 1, padding: '10px 16px', fontSize: 14, fontWeight: 500,
                fontFamily: 'var(--font)', background: 'transparent', color: '#1a1a18',
                border: '0.5px solid #c4c2b8', borderRadius: 'var(--radius-md)',
                cursor: isAnalysing || isUploading ? 'not-allowed' : 'pointer',
                opacity: isAnalysing || isUploading ? 0.5 : 1,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isAnalysing) e.currentTarget.style.background = '#f1efe8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isAnalysing ? 'Analysing…' : 'Analyse file'}
            </button>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || isAnalysing}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--font)',
              background: isUploadError ? '#993C1D' : 'var(--accent)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
              cursor: isUploading || isAnalysing ? 'not-allowed' : 'pointer',
              opacity: isUploading || isAnalysing ? 0.5 : 1,
            }}
          >
            {isUploading ? `Uploading… ${progress}%` : isUploadError ? 'Retry upload' : 'Upload files'}
          </button>
        </div>
      )}

      {/* Reset after upload */}
      {isUploadSuccess && (
        <button onClick={handleReset} style={{
          width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 500,
          fontFamily: 'var(--font)', background: 'transparent', color: '#1a1a18',
          border: '0.5px solid #c4c2b8', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', marginTop: '1.25rem', transition: 'background 0.12s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1efe8')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          Upload more files
        </button>
      )}

      {/* Analysis results table */}
      {isAnalysisSuccess && result && (
        <AnalysisResult result={result} onReset={resetAnalysis} />
      )}
    </div>
  );
};

export default UploadPage;
