import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
      <span style={{ color: '#334155', fontWeight: 600 }}>
        Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage <= 1 ? '#f1f5f9' : '#fff',
            color: currentPage <= 1 ? '#94a3b8' : '#1e293b',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
            color: currentPage >= totalPages ? '#94a3b8' : '#1e293b',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
