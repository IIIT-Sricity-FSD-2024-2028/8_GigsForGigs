import React, { useState, useMemo } from 'react';
import { SearchIcon } from './Icons';

/**
 * @file DataTable.tsx
 * @description
 * Generic, production-grade tabular data grid with client-side filtering,
 * search indexing, and pagination. Adheres to strict TypeScript generic patterns.
 */

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

export function DataTable<T extends Record<string, any>>({
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

  // Filter dataset by search term
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return safeData;
    const query = searchQuery.toLowerCase();

    return safeData.filter((item) => {
      if (searchableKey) {
        const val = item[searchableKey];
        return String(val ?? '').toLowerCase().includes(query);
      }
      return Object.values(item).some((val) =>
        String(val ?? '').toLowerCase().includes(query)
      );
    });
  }, [safeData, searchQuery, searchableKey]);

  // Compute pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

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
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchIcon
              size={16}
              color="var(--color-text-muted)"
              className=""
            />
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
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
