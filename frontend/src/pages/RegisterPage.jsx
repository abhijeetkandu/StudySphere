import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Eye, EyeOff, GraduationCap, UserPlus } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import StudySphereLogo from '../components/common/StudySphereLogo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useAppTheme();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        'Password must be at least 8 characters long, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&+=!).'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify(data));
        navigate('/student');
      } else {
        setError(data.error || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError('Network error. Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        background:
          mode === 'dark'
            ? 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(11, 15, 25, 1) 90%)'
            : 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 1) 90%)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' },
          maxWidth: 1000,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Left Info Banner */}
        <Box
          sx={{
            p: { xs: 4, sm: 6 },
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #4f46e5 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ mb: 4 }}>
              <StudySphereLogo
                size={44}
                showText
                subtitle="AI-Powered College Learning Platform"
                textColor="#ffffff"
                subtitleColor="rgba(255, 255, 255, 0.85)"
                variant="white"
              />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.15 }}>
              Join the Next-Gen Student Community.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
              Create your free student account to unlock AI-powered study assistance, personalized revision plans, gamified subject quizzes, and full academic syllabus tracking.
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '14px', backdropFilter: 'blur(8px)' }}>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', lineHeight: 1.5 }}>
              🏛️ <strong>Faculty / Teacher Notice:</strong> Instructor accounts are provisioned and maintained by institutional administrators. Please sign in via the Faculty Portal.
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ mt: 3, opacity: 0.75 }}>
            © {new Date().getFullYear()} StudySphere. Empowering Education.
          </Typography>
        </Box>

        {/* Right Form */}
        <Box sx={{ p: { xs: 4, sm: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Student Registration
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Sign up to create your personalized student learning account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <TextField
              label="Full Name"
              type="text"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Alex Morgan"
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. alex@student.edu"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="Min 8 chars with uppercase, lowercase, number & special char"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={!loading && <UserPlus size={18} />}
              sx={{
                py: 1.4,
                fontSize: '1rem',
                fontWeight: 700,
                mt: 1,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Student Account'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                Sign In here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
