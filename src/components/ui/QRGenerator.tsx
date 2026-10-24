import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  label?: string;
  showLabel?: boolean;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 160, label, showLabel = true }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-full box-border">
      <div className="p-2 bg-white rounded-xl flex items-center justify-center">
        <QRCodeSVG value={value || 'DWELLORA-QR-PASS'} size={size} level="M" />
      </div>
      {showLabel && (label || value) && (
        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md tracking-wider">
          {label || value}
        </span>
      )}
    </div>
  );
};
