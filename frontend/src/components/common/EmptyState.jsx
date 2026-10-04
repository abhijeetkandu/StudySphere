import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

export default function EmptyState({
  icon: Icon,
  title = 'No Data Found',
  description = 'There is nothing to display at this moment.',
  actionText,
  onAction,
  actionIcon: ActionIcon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          py: 6,
          px: 3,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider',
          my: 2,
        }}
      >
        {Icon && (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              mb: 2,
            }}
          >
            <Icon size={32} />
          </Box>
        )}

        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          {title}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mb: actionText ? 3 : 0 }}>
          {description}
        </Typography>

        {actionText && onAction && (
          <Button
            variant="contained"
            color="primary"
            onClick={onAction}
            startIcon={ActionIcon ? <ActionIcon size={18} /> : undefined}
          >
            {actionText}
          </Button>
        )}
      </Box>
    </motion.div>
  );
}
