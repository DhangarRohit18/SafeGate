import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Pagination } from './Pagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  mobileRender?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  emptyMessage = 'No data available',
  onRowClick,
  mobileRender,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  let sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isMobile && mobileRender) {
    return (
      <div style={{ width: '100%' }}>
        {paginatedData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontWeight: 500, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {paginatedData.map(item => (
              <div key={keyExtractor(item)}>
                {mobileRender(item)}
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
           <div style={{ marginTop: '1rem' }}>
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
           </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '0.85rem 1rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: col.width,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{col.header}</span>
                  {col.sortable && sortKey === col.key && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontWeight: 500 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) e.currentTarget.style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '0.85rem 1rem', color: '#1e293b', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.45 }}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
