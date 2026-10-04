import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const NotificationContext = createContext({
  showNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
});

export const useNotification = () => useContext(NotificationContext);

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // 'success' | 'error' | 'warning' | 'info'
  const [duration, setDuration] = useState(4000);

  const showNotification = useCallback((msg, sev = 'info', dur = 4000) => {
    setMessage(msg);
    setSeverity(sev);
    setDuration(dur);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg, dur = 3500) => {
    showNotification(msg, 'success', dur);
  }, [showNotification]);

  const showError = useCallback((msg, dur = 5000) => {
    showNotification(msg, 'error', dur);
  }, [showNotification]);

  const showInfo = useCallback((msg, dur = 3500) => {
    showNotification(msg, 'info', dur);
  }, [showNotification]);

  const showWarning = useCallback((msg, dur = 4000) => {
    showNotification(msg, 'warning', dur);
  }, [showNotification]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: '100%',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            fontSize: '0.92rem',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
