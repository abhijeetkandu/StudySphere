import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  color = '#6366f1',
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  badge,
  badgeColor = 'default',
  onClick,
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          p: 0.5,
          '&:hover': onClick
            ? {
                borderColor: color,
                boxShadow: `0 8px 24px -4px ${color}33`,
              }
            : {},
        }}
      >
        {/* Subtle accent bar at top */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradient,
          }}
        />

        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem',
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  mt: 0.5,
                  fontSize: { xs: '1.6rem', md: '2rem' },
                }}
              >
                {value}
              </Typography>
            </Box>

            {Icon && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: gradient,
                  color: '#ffffff',
                  boxShadow: `0 6px 16px -2px ${color}55`,
                  flexShrink: 0,
                }}
              >
                <Icon size={24} />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}

            {badge && (
              <Chip
                label={badge}
                size="small"
                color={badgeColor}
                sx={{ fontSize: '0.72rem', height: 22, fontWeight: 700 }}
              />
            )}

            {trend && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color:
                    trendType === 'positive'
                      ? 'success.main'
                      : trendType === 'negative'
                      ? 'error.main'
                      : 'text.secondary',
                }}
              >
                {trend}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
