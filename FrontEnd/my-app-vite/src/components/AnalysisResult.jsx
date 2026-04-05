import React, { useState, useMemo } from 'react';
import useTeamsNotify from '../hooks/useTeamsNotify';

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const findColIndex = (headers, keywords) =>
  headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k)));

const getStatus = (row, targetIdx, actualIdx) => {
  if (targetIdx === -1 || actualIdx === -1) return null;
  const target = parseFloat(row[targetIdx]);
  const actual = parseFloat(row[actualIdx]);
  if (isNaN(target) || isNaN(actual)) return null;
  return actual >= target ? 'on' : 'off';
};

const StatusBadge = ({ status }) => {
  if (!status) return <span style={{ color: '#b4b2a9' }}>—</span>;
  const on = status === 'on';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: on ? '#EAF3DE' : '#FCEBEB',
      color: on ? '#3B6D11' : '#A32D2D',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: on ? '#639922' : '#E24B4A',
      }} />
      {on ? 'On target' : 'Not on target'}
    </span>
  );
};

// Reusable filter input with dropdown + text search
const FilterCell = ({ label, values, selected, onSelect, search, onSearch }) => {
  const [open, setOpen] = useState(false);

  const filtered = values.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <th style={{
      padding: '6px 10px', borderBottom: '0.5px solid #d3d1c7',
      background: '#eae8e1', verticalAlign: 'top', minWidth: 130,
    }}>
      <div style={{ position: 'relative' }}>
        {/* Text search input */}
        <input
          type="text"
          placeholder={`Search ${label}…`}
          value={search}
          onChange={e => { onSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{
            width: '100%', padding: '4px 26px 4px 8px', fontSize: 11,
            fontFamily: 'var(--font)', border: '0.5px solid #c4c2b8',
            borderRadius: 6, background: '#fff', color: '#1a1a18',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {/* Dropdown arrow */}
        <span style={{
          position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, color: '#888780', pointerEvents: 'none',
        }}>▼</span>

        {/* Dropdown list */}
        {open && filtered.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: '#fff', border: '0.5px solid #d3d1c7',
            borderRadius: 6, marginTop: 2, maxHeight: 180,
            overflowY: 'auto', minWidth: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            {/* Clear option */}
            <div
              onMouseDown={() => { onSelect(''); onSearch(''); }}
              style={{
                padding: '6px 10px', fontSize: 11, cursor: 'pointer',
                color: '#888780', borderBottom: '0.5px solid #ebebea',
                background: selected === '' ? '#f1efe8' : 'transparent',
              }}
            >
              All
            </div>
            {filtered.map((v, i) => (
              <div
                key={i}
                onMouseDown={() => { onSelect(v); onSearch(v); }}
                style={{
                  padding: '6px 10px', fontSize: 11, cursor: 'pointer',
                  background: selected === v ? '#f1efe8' : 'transparent',
                  color: '#1a1a18',
                  borderBottom: i < filtered.length - 1 ? '0.5px solid #ebebea' : 'none',
                }}
                onMouseEnter={e => { if (selected !== v) e.currentTarget.style.background = '#fafaf8'; }}
                onMouseLeave={e => { if (selected !== v) e.currentTarget.style.background = 'transparent'; }}
              >
                {v}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active filter badge */}
      {selected && (
        <div style={{
          marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'var(--accent-text)',
        }}>
          <span style={{
            background: 'var(--accent-bg)', borderRadius: 4,
            padding: '1px 6px', maxWidth: 110,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selected}
          </span>
          <button
            onClick={() => { onSelect(''); onSearch(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888780', fontSize: 12, lineHeight: 1, padding: 0,
            }}
            title="Clear filter"
          >×</button>
        </div>
      )}
    </th>
  );
};

// Blank spacer header cell for non-filtered columns
const PlainTh = ({ label }) => (
  <th style={{
    padding: '8px 12px', textAlign: 'left', fontWeight: 500,
    color: '#444441', borderBottom: '0.5px solid #d3d1c7',
    whiteSpace: 'nowrap', background: '#f1efe8', verticalAlign: 'middle',
  }}>
    {label}
  </th>
);

const SheetTable = ({ sheet }) => {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const targetIdx = findColIndex(sheet.headers, ['target']);
  const actualIdx = findColIndex(sheet.headers, ['actual']);
  const dateIdx   = findColIndex(sheet.headers, ['date']);
  const machineIdx = findColIndex(sheet.headers, ['machine']);
  const hasStatusCol = targetIdx !== -1 && actualIdx !== -1;

  // Filter state
  const [dateSearch, setDateSearch] = useState('');
  const [dateSelected, setDateSelected] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [machineSelected, setMachineSelected] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [statusSelected, setStatusSelected] = useState('');

  // Unique dropdown values
  const uniqueDates = useMemo(() =>
    [...new Set(sheet.rows.map(r => r[dateIdx] ?? '').filter(Boolean))].sort(),
    [sheet.rows, dateIdx]);

  const uniqueMachines = useMemo(() =>
    [...new Set(sheet.rows.map(r => r[machineIdx] ?? '').filter(Boolean))].sort(),
    [sheet.rows, machineIdx]);

  const statusOptions = ['On target', 'Not on target'];

  // Filter rows
  const filteredRows = useMemo(() => {
    return sheet.rows.filter(row => {
      if (dateSelected && row[dateIdx] !== dateSelected) return false;
      if (machineSelected && row[machineIdx] !== machineSelected) return false;
      if (statusSelected && hasStatusCol) {
        const st = getStatus(row, targetIdx, actualIdx);
        const label = st === 'on' ? 'On target' : st === 'off' ? 'Not on target' : '';
        if (label !== statusSelected) return false;
      }
      // Text search fallback for partial matches
      if (dateSearch && !dateSelected && dateIdx !== -1 &&
        !row[dateIdx]?.toLowerCase().includes(dateSearch.toLowerCase())) return false;
      if (machineSearch && !machineSelected && machineIdx !== -1 &&
        !row[machineIdx]?.toLowerCase().includes(machineSearch.toLowerCase())) return false;
      if (statusSearch && !statusSelected && hasStatusCol) {
        const st = getStatus(row, targetIdx, actualIdx);
        const label = st === 'on' ? 'On target' : st === 'off' ? 'Not on target' : '';
        if (!label.toLowerCase().includes(statusSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [sheet.rows, dateSelected, machineSelected, statusSelected,
      dateSearch, machineSearch, statusSearch,
      dateIdx, machineIdx, targetIdx, actualIdx, hasStatusCol]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const visibleRows = filteredRows.slice(page * pageSize, page * pageSize + pageSize);

  const activeFilters = [dateSelected, machineSelected, statusSelected].filter(Boolean).length;

  const clearAll = () => {
    setDateSearch(''); setDateSelected('');
    setMachineSearch(''); setMachineSelected('');
    setStatusSearch(''); setStatusSelected('');
    setPage(0);
  };

  // Reset to page 0 when filters change
  const wrap = (setter) => (v) => { setter(v); setPage(0); };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Sheet header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18' }}>
          {sheet.sheetName}
          {activeFilters > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 11, background: 'var(--accent-bg)',
              color: 'var(--accent-text)', padding: '1px 8px', borderRadius: 99,
            }}>
              {filteredRows.length} of {sheet.rowCount} rows
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activeFilters > 0 && (
            <button onClick={clearAll} style={{
              fontSize: 11, color: '#A32D2D', cursor: 'pointer',
              background: '#FCEBEB', border: 'none', borderRadius: 6,
              padding: '3px 10px', fontFamily: 'var(--font)',
            }}>
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
          <div style={{ fontSize: 11, color: '#888780', fontFamily: 'var(--mono)' }}>
            {sheet.rowCount} rows · {sheet.columnCount} cols
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '0.5px solid #d3d1c7', borderRadius: 'var(--radius-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            {/* Column name row */}
            <tr style={{ background: '#f1efe8' }}>
              {sheet.headers.map((h, i) => (
                <PlainTh key={i} label={h || `Column ${i + 1}`} />
              ))}
              {hasStatusCol && (
                <>
                  <PlainTh label="Status" />
                  <PlainTh label="Indicator" />
                </>
              )}
            </tr>

            {/* Filter row */}
            <tr>
              {sheet.headers.map((h, i) => {
                const lower = h.toLowerCase();
                if (lower.includes('date') && dateIdx === i) {
                  return (
                    <FilterCell key={i} label="Date"
                      values={uniqueDates}
                      selected={dateSelected} onSelect={wrap(setDateSelected)}
                      search={dateSearch} onSearch={wrap(setDateSearch)}
                    />
                  );
                }
                if (lower.includes('machine') && machineIdx === i) {
                  return (
                    <FilterCell key={i} label="Machine"
                      values={uniqueMachines}
                      selected={machineSelected} onSelect={wrap(setMachineSelected)}
                      search={machineSearch} onSearch={wrap(setMachineSearch)}
                    />
                  );
                }
                // Non-filtered column — blank cell
                return (
                  <th key={i} style={{
                    padding: '6px 10px', background: '#eae8e1',
                    borderBottom: '0.5px solid #d3d1c7',
                  }} />
                );
              })}
              {hasStatusCol && (
                <>
                  <FilterCell label="Status"
                    values={statusOptions}
                    selected={statusSelected} onSelect={wrap(setStatusSelected)}
                    search={statusSearch} onSearch={wrap(setStatusSearch)}
                  />
                  <th style={{ background: '#eae8e1', borderBottom: '0.5px solid #d3d1c7' }} />
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={sheet.headers.length + (hasStatusCol ? 2 : 0)}
                  style={{ padding: '2rem', textAlign: 'center', color: '#888780', fontSize: 13 }}>
                  No rows match the current filters.
                </td>
              </tr>
            ) : visibleRows.map((row, ri) => {
              const status = getStatus(row, targetIdx, actualIdx);
              return (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#ffffff' : '#fafaf8' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '7px 12px', color: '#2c2c2a',
                      borderBottom: '0.5px solid #ebebea',
                      maxWidth: 200, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={cell}>
                      {cell === '' ? <span style={{ color: '#d3d1c7' }}>—</span> : cell}
                    </td>
                  ))}
                  {hasStatusCol && (
                    <>
                      <td style={{
                        padding: '7px 12px', borderBottom: '0.5px solid #ebebea',
                        color: status === 'on' ? '#3B6D11' : status === 'off' ? '#A32D2D' : '#b4b2a9',
                        fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        {status === 'on' ? 'On target' : status === 'off' ? 'Not on target' : '—'}
                      </td>
                      <td style={{ padding: '7px 12px', borderBottom: '0.5px solid #ebebea' }}>
                        <StatusBadge status={status} />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 8, fontSize: 12, color: '#888780',
        }}>
          <span>
            Rows {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredRows.length)} of {filteredRows.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{
                padding: '3px 10px', fontSize: 12, fontFamily: 'var(--font)',
                background: 'transparent', border: '0.5px solid #d3d1c7',
                borderRadius: 'var(--radius-md)', cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1, color: '#1a1a18',
              }}>← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              style={{
                padding: '3px 10px', fontSize: 12, fontFamily: 'var(--font)',
                background: 'transparent', border: '0.5px solid #d3d1c7',
                borderRadius: 'var(--radius-md)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page === totalPages - 1 ? 0.4 : 1, color: '#1a1a18',
              }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamsButton = ({ result }) => {
  const { status, message, send } = useTeamsNotify();
  const isSending = status === 'sending';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div style={{ marginTop: '1rem' }}>
      <button
        onClick={() => send(result)}
        disabled={isSending || isSuccess}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', fontSize: 13, fontWeight: 500,
          fontFamily: 'var(--font)', cursor: isSending || isSuccess ? 'not-allowed' : 'pointer',
          border: 'none', borderRadius: 'var(--radius-md)',
          background: isSuccess ? '#EAF3DE' : isError ? '#FCEBEB' : '#464775',
          color: isSuccess ? '#3B6D11' : isError ? '#A32D2D' : '#ffffff',
          opacity: isSending ? 0.7 : 1,
          transition: 'opacity 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { if (!isSending && !isSuccess) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {/* Teams icon */}
        {!isSuccess && !isError && (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="white">
            <path d="M20.625 7.125a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25z"/>
            <path d="M14.25 8.25h7.5v8.25a3 3 0 0 1-3 3h-1.5a3 3 0 0 1-3-3V8.25z"/>
            <path d="M9.375 8.625a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z"/>
            <path d="M3 9.75h12.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-8.25A2.25 2.25 0 0 1 3 17.25V9.75z"/>
          </svg>
        )}
        {isSending ? 'Sending to Teams…' : isSuccess ? '✓ Sent to Teams' : isError ? '✗ Failed — retry' : 'Send summary to Teams'}
      </button>

      {/* Status message */}
      {message && (
        <div style={{
          marginTop: 6, fontSize: 12,
          color: isSuccess ? '#3B6D11' : '#A32D2D',
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

const AnalysisResult = ({ result, onReset }) => (
  <div style={{ marginTop: '1.5rem' }}>
    {/* File summary bar */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', background: '#f1efe8',
      border: '0.5px solid #d3d1c7', borderRadius: 'var(--radius-md)', marginBottom: '1rem',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18' }}>{result.fileName}</div>
        <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
          {result.fileType} · {formatSize(result.sizeBytes)} · {result.sheets.length} sheet{result.sheets.length !== 1 ? 's' : ''}
        </div>
      </div>
      <button onClick={onReset} style={{
        fontSize: 12, color: '#888780', cursor: 'pointer', background: 'none',
        border: '0.5px solid #d3d1c7', borderRadius: 'var(--radius-md)',
        padding: '4px 10px', fontFamily: 'var(--font)', transition: 'background 0.12s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = '#e8e6df')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >Clear</button>
    </div>

    {result.sheets.map((sheet, i) => (
      <SheetTable key={i} sheet={sheet} />
    ))}

    {/* Teams send button */}
    <TeamsButton result={result} />
  </div>
);

export default AnalysisResult;
