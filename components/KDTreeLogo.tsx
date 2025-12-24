
import React from 'react';

const KDTreeLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40'
  };

  return (
    <div className={`relative ${sizes[size]} flex items-center justify-center group`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Thân cây cách điệu chữ K */}
        <path d="M35 25 V75 M35 50 L55 25 M35 50 L55 50" stroke="url(#logoGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Vòm lá cách điệu chữ D */}
        <path d="M55 25 C75 25, 85 40, 85 50 C85 60, 75 75, 55 75" stroke="url(#logoGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Điểm nhấn mầm xanh */}
        <circle cx="55" cy="25" r="5" fill="#4ade80" className="animate-pulse" />
        <circle cx="85" cy="50" r="4" fill="#22c55e" />
        <circle cx="55" cy="75" r="5" fill="#15803d" />
      </svg>
    </div>
  );
};

export default KDTreeLogo;
