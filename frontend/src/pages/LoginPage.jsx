import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  useTheme,
} from '@mui/material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Eye, EyeOff, BookOpen, BrainCircuit, Gamepad2, GraduationCap, School, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../context/ThemeContext';
import StudySphereLogo from '../components/common/StudySphereLogo';

export default function LoginPage() {
  const { portalRole } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useAppTheme();

  // Determine active portal: 'STUDENT', 'TEACHER', or 'ADMIN'
  const getInitialPortal = () => {
    if (portalRole === 'teacher' || portalRole === 'faculty') return 'TEACHER';
    if (portalRole === 'admin') return 'ADMIN';
    return 'STUDENT';
  };

  const [activePortal, setActivePortal] = useState(getInitialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portalRole) {
      if (portalRole === 'teacher' || portalRole === 'faculty') setActivePortal('TEACHER');
      else if (portalRole === 'admin') setActivePortal('ADMIN');
      else setActivePortal('STUDENT');
    }
  }, [portalRole]);

  const handlePortalChange = (event, newPortal) => {
    if (!newPortal) return;
    setActivePortal(newPortal);
    setError('');
    const targetPath = newPortal === 'TEACHER' ? '/login/teacher' : newPortal === 'ADMIN' ? '/login/admin' : '/login/student';
    navigate(targetPath, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Enforce portal matching
        if (activePortal === 'STUDENT' && data.role !== 'STUDENT') {
          if (data.role === 'TEACHER') {
            setError('This is a Faculty / Teacher account. Please switch to the Faculty Portal.');
          } else if (data.role === 'ADMIN') {
            setError('This is an Administrator account. Please switch to the Admin Portal.');
          }
          setLoading(false);
          return;
        }

        if (activePortal === 'TEACHER' && data.role !== 'TEACHER') {
          if (data.role === 'STUDENT') {
            setError('Access denied: This account is registered as a Student. Please switch to the Student Portal.');
          } else {
            setError('Access denied: Faculty credentials required for this portal.');
          }
          setLoading(false);
          return;
        }

        if (activePortal === 'ADMIN' && data.role !== 'ADMIN') {
          setError('Access denied: Institutional Administrator privileges required.');
          setLoading(false);
          return;
        }

        sessionStorage.setItem('user', JSON.stringify(data));
        if (data.role === 'ADMIN') navigate('/admin');
        else if (data.role === 'TEACHER') navigate('/teacher');
        else navigate('/student');
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const portalConfig = {
    STUDENT: {
      title: 'Student Portal',
      subtitle: 'Sign in to access your AI tutor, courses, quizzes, timetable, and study planner.',
      badge: 'Learner Access',
      badgeColor: 'primary',
      placeholderEmail: 'e.g. alex@student.studysphere.edu',
    },
    TEACHER: {
      title: 'Faculty Portal',
      subtitle: 'Sign in to manage curriculum, publish study materials, organize quizzes, and monitor cohorts.',
      badge: 'Faculty Access',
      badgeColor: 'success',
      placeholderEmail: 'e.g. professor.miller@university.edu',
    },
    ADMIN: {
      title: 'Admin Portal',
      subtitle: 'Institutional control panel for academic structure, faculty provisioning, and system analytics.',
      badge: 'Administrator',
      badgeColor: 'secondary',
      placeholderEmail: 'e.g. admin@studysphere.edu',
    },
  };

  const currentConfig = portalConfig[activePortal];

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
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
          maxWidth: 1080,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Left Side: Brand & Feature Showcase */}
        <Box
          sx={{
            p: { xs: 4, sm: 6 },
            background:
              activePortal === 'TEACHER'
                ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%)'
                : activePortal === 'ADMIN'
                ? 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.5s ease',
          }}
        >
          {/* Decorative background circle */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              filter: 'blur(30px)',
            }}
          />

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
              Elevate Your Academic Potential.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, fontSize: '1.02rem', lineHeight: 1.6 }}>
              Enterprise-grade academic platform offering dedicated access portals for students, faculty instructors, and institutional administrators.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { icon: BrainCircuit, title: 'AI Study Assistant & Planner', desc: 'Instant conceptual guidance and personalized study schedules' },
                { icon: Gamepad2, title: 'Gamified Quizzes & Analytics', desc: 'Real-time scoreboards, cohort tracking and performance metrics' },
                { icon: BookOpen, title: 'Institutional Curriculum Suite', desc: 'Integrated syllabus, faculty material hub, and academic calendar' },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(255, 255, 255, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {feat.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.82 }}>
                        {feat.desc}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Typography variant="caption" sx={{ mt: 5, opacity: 0.75 }}>
            © {new Date().getFullYear()} StudySphere. Secure Academic Portal.
          </Typography>
        </Box>

        {/* Right Side: Login Form with Portal Tabs */}
        <Box sx={{ p: { xs: 3.5, sm: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Portal Switcher Tabs */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Select Login Portal
            </Typography>
            <Tabs
              value={activePortal}
              onChange={handlePortalChange}
              variant="fullWidth"
              sx={{
                bgcolor: 'action.hover',
                borderRadius: '12px',
                p: 0.5,
                minHeight: 44,
                '& .MuiTabs-indicator': {
                  height: '100%',
                  borderRadius: '10px',
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 0,
                },
                '& .MuiTab-root': {
                  zIndex: 1,
                  minHeight: 38,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 0.8,
                  alignItems: 'center',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'text.primary',
                  },
                },
              }}
            >
              <Tab value="STUDENT" label="Student" icon={<GraduationCap size={16} />} />
              <Tab value="TEACHER" label="Faculty" icon={<School size={16} />} />
              <Tab value="ADMIN" label="Admin" icon={<ShieldCheck size={16} />} />
            </Tabs>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {currentConfig.title}
            </Typography>
            <Chip
              label={currentConfig.badge}
              size="small"
              color={currentConfig.badgeColor}
              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {currentConfig.subtitle}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={currentConfig.placeholderEmail}
              autoComplete="email"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
              sx={{
                py: 1.3,
                fontSize: '1rem',
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : `Sign In to ${currentConfig.title}`}
            </Button>
          </form>

          {/* Student Registration Link */}
          {activePortal === 'STUDENT' && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                New student?{' '}
                <Link to="/register" style={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                  Create Student Account
                </Link>
              </Typography>
            </Box>
          )}

          {activePortal === 'TEACHER' && (
            <Box sx={{ textAlign: 'center', mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                💡 Faculty accounts are created and managed by Institutional Administrators. If you need account credentials, please contact your academic office.
              </Typography>
            </Box>
          )}

          {activePortal === 'ADMIN' && (
            <Box sx={{ textAlign: 'center', mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                🔒 Institutional administrator access is restricted to verified institutional administrative personnel only.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

