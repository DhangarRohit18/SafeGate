import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 160, label }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QRCodeSVG value={value || 'DWELLORA-QR-PASS'} size={size} level="M" />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: '#334155' }}>
        {label || value}
      </span>
    </div>
  );
};
