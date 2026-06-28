/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SunshineLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textColor?: 'dark' | 'light';
  textSubTitle?: string;
}

export default function SunshineLogo({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'dark',
  textSubTitle = 'EXCELLENCE IN EDUCATION'
}: SunshineLogoProps) {
  // Determine pixel sizes for the icon
  const getIconSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 80;
      case 'xl': return 120;
      default: return 48;
    }
  };

  const iconSize = getIconSize();

  return (
    <div id="sunshine-logo" className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Icon representing Sun, Human, and Open Book */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Sun Ray Gradient */}
          <linearGradient id="sunRayGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" /> {/* Orange 600 */}
            <stop offset="50%" stopColor="#F59E0B" /> {/* Yellow 500 */}
            <stop offset="100%" stopColor="#FBBF24" /> {/* Amber 400 */}
          </linearGradient>

          {/* Book Cover / Pages Gradient */}
          <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B2545" /> {/* Very Deep Blue */}
            <stop offset="100%" stopColor="#1E40AF" /> {/* Blue 800 */}
          </linearGradient>

          {/* Book Edge / Trim Accent Gradient */}
          <linearGradient id="trimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* ==================== SUN RAYS (FLAMES) ==================== */}
        <g id="sun-rays">
          {/* Ray 1: Top Center */}
          <path d="M100 45 C100 20 95 10 100 5 C105 10 100 20 100 45 Z" fill="url(#sunRayGrad)" />
          {/* Ray 2: Angle 15° Right */}
          <path d="M112 47 C122 25 125 15 132 12 C131 18 123 27 112 47 Z" fill="url(#sunRayGrad)" />
          {/* Ray 3: Angle 45° Right */}
          <path d="M125 53 C145 35 152 30 161 31 C157 37 144 43 125 53 Z" fill="url(#sunRayGrad)" />
          {/* Ray 4: Angle 75° Right */}
          <path d="M135 68 C165 58 174 58 184 62 C178 65 162 65 135 68 Z" fill="url(#sunRayGrad)" />
          {/* Ray 5: Angle 105° Right */}
          <path d="M140 85 C175 88 185 92 192 101 C184 100 170 95 140 85 Z" fill="url(#sunRayGrad)" />
          
          {/* Ray 6: Angle 15° Left */}
          <path d="M88 47 C78 25 75 15 68 12 C69 18 77 27 88 47 Z" fill="url(#sunRayGrad)" />
          {/* Ray 7: Angle 45° Left */}
          <path d="M75 53 C55 35 48 30 39 31 C43 37 56 43 75 53 Z" fill="url(#sunRayGrad)" />
          {/* Ray 8: Angle 75° Left */}
          <path d="M65 68 C35 58 26 58 16 62 C22 65 38 65 65 68 Z" fill="url(#sunRayGrad)" />
          {/* Ray 9: Angle 105° Left */}
          <path d="M60 85 C25 88 15 92 8 101 C16 100 30 95 60 85 Z" fill="url(#sunRayGrad)" />
        </g>

        {/* ==================== SUN RING / ARCH ==================== */}
        <path
          d="M60 90 A 45 45 0 0 1 140 90"
          stroke="url(#sunRayGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* ==================== STYLIZED OPEN BOOK ==================== */}
        {/* Book Left Side (Background shadow layer) */}
        <path d="M100 120 C60 100 30 110 15 125 C30 110 60 100 100 120 Z" fill="#F59E0B" opacity="0.6" />
        
        {/* Book Right Side (Background shadow layer) */}
        <path d="M100 120 C140 100 170 110 185 125 C170 110 140 100 100 120 Z" fill="#F59E0B" opacity="0.6" />

        {/* Main Book Wings */}
        {/* Left Wing */}
        <path
          d="M100 125 C65 105 30 115 15 130 L15 105 C30 90 65 80 100 105 Z"
          fill="url(#bookGrad)"
        />
        
        {/* Right Wing */}
        <path
          d="M100 125 C135 105 170 115 185 130 L185 105 C170 90 135 80 100 105 Z"
          fill="url(#bookGrad)"
        />

        {/* Book Page Accent Lines (Inner details representing text/pages) */}
        <path d="M28 112 C45 102 70 96 92 110" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M30 118 C48 108 72 102 92 116" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M32 124 C50 114 74 108 92 122" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

        <path d="M172 112 C155 102 130 96 108 110" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M170 118 C152 108 128 102 108 116" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M168 124 C150 114 126 108 108 122" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

        {/* Book Ribbon / Gold bottom trim */}
        <path
          d="M15 130 C50 115 80 115 100 132 C120 115 150 115 185 130 C150 112 120 112 100 129 C80 112 50 112 15 130 Z"
          fill="url(#trimGrad)"
        />

        {/* ==================== CENTRAL HUMAN FIGURE (Y-SHAPE) ==================== */}
        <g id="human-figure">
          {/* Head (Circular Sphere) */}
          <circle cx="100" cy="78" r="8" fill="#0B2545" />
          
          {/* Rising Body & Uplifted Arms */}
          <path
            d="M100 120 
               C98 110 93 96 76 86
               C88 90 95 98 100 110
               C105 98 112 90 124 86
               C107 96 102 110 100 120 Z"
            fill="#0B2545"
          />
        </g>
      </svg>

      {/* Brand Text Rendering */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-display font-black tracking-wide leading-none uppercase ${
              textColor === 'dark' ? 'text-[#0B2545]' : 'text-white'
            } ${
              typeof size === 'number'
                ? size > 80 ? 'text-2xl' : size > 40 ? 'text-sm' : 'text-xs'
                : size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-xs'
            }`}
          >
            SUNSHINE
          </span>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-brand-orange"></span>
            <span
              className={`font-sans font-extrabold tracking-widest leading-none uppercase text-brand-orange ${
                typeof size === 'number'
                  ? size > 80 ? 'text-sm' : 'text-[9px]'
                  : size === 'xl' ? 'text-base' : size === 'lg' ? 'text-xs' : 'text-[9px]'
              }`}
            >
              CLASSES
            </span>
            <span className="h-[1px] flex-1 bg-gradient-to-r from-brand-orange to-transparent"></span>
          </div>

          {textSubTitle && (
            <span
              className={`font-sans font-bold tracking-[0.15em] uppercase text-[7px] mt-1 opacity-70 ${
                textColor === 'dark' ? 'text-slate-500' : 'text-slate-300'
              }`}
            >
              {textSubTitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
