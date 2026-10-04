import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  action,
  showBack = false,
  backPath,
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          mb: 3.5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          {breadcrumbs.length > 0 && (
            <Breadcrumbs
              separator={<ChevronRight size={14} style={{ opacity: 0.5 }} />}
              sx={{ mb: 1, fontSize: '0.82rem' }}
            >
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return isLast ? (
                  <Typography key={idx} color="text.primary" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {b.label}
                  </Typography>
                ) : (
                  <MuiLink
                    key={idx}
                    component={Link}
                    to={b.path}
                    underline="hover"
                    color="text.secondary"
                    sx={{ fontSize: '0.82rem' }}
                  >
                    {b.label}
                  </MuiLink>
                );
              })}
            </Breadcrumbs>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {showBack && (
              <Box
                onClick={() => (backPath ? navigate(backPath) : navigate(-1))}
                sx={{
                  p: 0.8,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <ArrowLeft size={20} />
              </Box>
            )}

            {Icon && (
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: 0.9,
                }}
              >
                <Icon size={22} />
              </Box>
            )}

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.4rem', sm: '1.75rem' },
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.4 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {action && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{action}</Box>}
      </Box>
    </motion.div>
  );
}
