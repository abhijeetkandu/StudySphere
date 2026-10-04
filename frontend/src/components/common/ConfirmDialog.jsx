import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmColor = 'error', // 'error' | 'primary' | 'warning'
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          p: 1,
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: `${confirmColor}.light`,
            color: `${confirmColor}.dark`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onCancel} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          sx={{ fontWeight: 700 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
