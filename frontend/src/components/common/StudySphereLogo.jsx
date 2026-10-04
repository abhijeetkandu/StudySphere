import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StudySphereLogo({
  size = 38,
  showText = false,
  subtitle = 'AI-Powered College Learning Platform',
  textColor = 'text.primary',
  subtitleColor = 'text.secondary',
  collapsed = false,
  variant = 'default',
}) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, userSelect: 'none' }}>
      {/* Custom Modern StudySphere AI + Education Icon */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: `${Math.max(8, Math.round(size * 0.28))}px`,
          background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background glow effect */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)',
          }}
        />

        <svg
          width={Math.round(size * 0.65)}
          height={Math.round(size * 0.65)}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Orbital Knowledge Sphere Ring */}
          <ellipse
            cx="16"
            cy="16"
            rx="13"
            ry="5.5"
            transform="rotate(-25 16 16)"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeOpacity="0.5"
            strokeDasharray="2.5 1.5"
          />

          {/* Academic Graduation Cap Crest */}
          <path
            d="M16 4.5L27 10.5L16 16.5L5 10.5L16 4.5Z"
            fill="#ffffff"
            fillOpacity="0.95"
          />
          {/* Cap Lower Base / Book Pedestal */}
          <path
            d="M9 13.2V19.5C9 22.8 12.1 25.5 16 25.5C19.9 25.5 23 22.8 23 19.5V13.2L16 17L9 13.2Z"
            fill="#ffffff"
            fillOpacity="0.85"
          />
          {/* Tassel */}
          <path
            d="M25 11.5V18.5C25 19.2 24.2 19.8 23.5 19.5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          
          {/* AI Neural Spark at Core */}
          <path
            d="M16 8L17.2 10.8L20 12L17.2 13.2L16 16L14.8 13.2L12 12L14.8 10.8L16 8Z"
            fill="#38bdf8"
          />
          <circle cx="16" cy="12" r="1.2" fill="#ffffff" />
        </svg>
      </Box>

      {/* Brand Name & Subtitle */}
      {showText && !collapsed && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: textColor,
              fontSize: size > 32 ? '1.15rem' : '1.02rem',
            }}
          >
            STUDY<span style={{ color: variant === 'white' || textColor === '#ffffff' ? '#93c5fd' : '#2563eb' }}>SPHERE</span>
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: subtitleColor,
                fontWeight: 600,
                fontSize: '0.66rem',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                mt: 0.2,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
