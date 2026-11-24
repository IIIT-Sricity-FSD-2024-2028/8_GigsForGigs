import React, { useState, useMemo } from 'react';
import { SearchIcon } from './Icons';

/**
 * @file DataTable.tsx
 * @description
 * Generic, production-grade tabular data grid with deep recursive search,
 * client-side filtering, and automatic pagination resets. Adheres to strict TypeScript generic patterns.
 */

function matchesDeep(val: unknown, query: string): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val).toLowerCase().includes(query);
  }
  if (Array.isArray(val)) {
    return val.some((sub) => matchesDeep(sub, query));
  }
  if (typeof val === 'object') {
    return Object.values(val as Record<string, unknown>).some((sub) => matchesDeep(sub, query));
  }
  return false;
}

// ponytail: exports scalar top-level fields of the filtered rows; per-column formatting if a report needs it.
// A cell starting (after any whitespace) with = + - @, or with tab/CR, is prefixed with ' so spreadsheets never run user-supplied text as a formula.
function downloadCsv(rows: object[], name: string) {
  const firstRow = rows[0] as Record<string, unknown> | undefined;
  const keys = firstRow ? Object.keys(firstRow).filter((k) => typeof firstRow[k] !== 'object') : [];
  const cell = (v: unknown) => `"${String(v ?? '').replace(/^(\s*[=+\-@]|[\t\r])/, "'$&").replace(/"/g, '""')}"`;
  const csv = [keys.map(cell).join(','), ...rows.map((r) => keys.map((k) => cell((r as Record<string, unknown>)[k])).join(','))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchableKey?: keyof T;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  title?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends object>({
  columns,
  data = [],
  searchPlaceholder = 'Search records...',
  searchableKey,
  pageSize = 8,
  onRowClick,
  title,
  actions
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Deep recursive filter dataset by search term
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return safeData;
    const query = searchQuery.toLowerCase().trim();

    return safeData.filter((item) => {
      if (searchableKey) {
        return matchesDeep(item[searchableKey], query);
      }
      return matchesDeep(item, query);
    });
  }, [safeData, searchQuery, searchableKey]);

  // Compute pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, activePage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="admin-card" style={{ overflow: 'hidden' }}>
      {/* Table Header & Controls */}
      <div
        style={{
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
          backgroundColor: 'var(--color-bg-white)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {title && (
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-dark)' }}>
              {title}
            </h3>
          )}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-light)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
            {filteredData.length} records
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: '1 1 auto', maxWidth: '380px', marginLeft: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '10px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <SearchIcon
                size={16}
                color="var(--color-text-muted)"
              />
            </div>
            <input
              type="text"
              className="admin-input"
              style={{ paddingLeft: '2.2rem', fontSize: 'var(--font-size-xs)' }}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={filteredData.length === 0}
            onClick={() => downloadCsv(filteredData, (title || 'export').toLowerCase().replace(/\W+/g, '-'))}
            title="Download the filtered rows as CSV"
          >
            Export CSV
          </button>
          {actions}
        </div>
      </div>

      {/* Table Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(8, 75, 131, 0.04)', borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    fontSize: 'var(--font-size-xs)',
                    letterSpacing: '0.04em',
                    width: col.width,
                    textAlign: col.align || 'left'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(8, 75, 131, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '0.9rem 1rem',
                        color: 'var(--color-text-dark)',
                        textAlign: col.align || 'left'
                      }}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '—')
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: 'var(--spacing-xxl) var(--spacing-md)',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', marginBottom: '4px' }}>
                    No matching records found
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)' }}>
                    Try refining your search query or reset filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-white)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)'
          }}
        >
          <span>
            Page {activePage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={activePage === 1}
              onClick={() => handlePageChange(activePage - 1)}
              style={{ opacity: activePage === 1 ? 0.5 : 1, cursor: activePage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={activePage === totalPages}
              onClick={() => handlePageChange(activePage + 1)}
              style={{ opacity: activePage === totalPages ? 0.5 : 1, cursor: activePage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
