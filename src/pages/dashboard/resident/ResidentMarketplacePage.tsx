import React from 'react';
import { CommunityMarketplaceHub } from '../../../domains/community';

export const ResidentMarketplacePage: React.FC = () => {
  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44">
        <CommunityMarketplaceHub userRole="RESIDENT" initialTab="MARKETPLACE" />
      </div>
    </div>
  );
};

export default ResidentMarketplacePage;
