import React from 'react';
import { SocietyExpenseHub } from '../../../domains/expenses';

export const AdminExpensePage: React.FC = () => {
  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      <SocietyExpenseHub userRole="SOCIETY_ADMIN" />
    </div>
  );
};

export default AdminExpensePage;
