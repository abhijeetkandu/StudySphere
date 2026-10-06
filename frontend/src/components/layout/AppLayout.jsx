import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  InputBase,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu as MenuIcon,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  BookOpen,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  Sparkles,
  Gamepad2,
  BrainCircuit,
  BarChart3,
  Megaphone,
  GraduationCap,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  School,
  Building,
  FolderTree,
  ListOrdered,
  Users,
} from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';
import StudySphereLogo from '../common/StudySphereLogo';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 76;

export default function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } else {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  // Role based navigation config
  const getNavItems = () => {
    const role = user.role;

    if (role === 'STUDENT') {
      return [
        { label: 'Dashboard', path: '/student', icon: GraduationCap },
        { label: 'Quizzes Arena', path: '/quiz-game', icon: Gamepad2 },
        { label: 'AI Assistant', path: '/ai-assistant', icon: BrainCircuit },
        { label: 'Study Planner', path: '/study-planner', icon: Sparkles },
        { label: 'Syllabus', path: '/syllabus', icon: BookOpen },
        { label: 'Timetable', path: '/timetable', icon: Clock },
        { label: 'Study Materials', path: '/materials', icon: FileText },
        { label: 'Reminders', path: '/reminders', icon: Bell },
        { label: 'Academic Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      ];
    }

    if (role === 'TEACHER') {
      return [
        { label: 'Dashboard', path: '/teacher', icon: GraduationCap },
        { label: 'Manage Quizzes', path: '/quiz-manage', icon: Gamepad2 },
        { label: 'Syllabus', path: '/syllabus', icon: BookOpen },
        { label: 'Timetable', path: '/timetable', icon: Clock },
        { label: 'Study Materials', path: '/materials', icon: FileText },
        { label: 'Announcements', path: '/announcements', icon: Megaphone },
        { label: 'Academic Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Reminders', path: '/reminders', icon: Clock },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      ];
    }

    // ADMIN
    return [
      { label: 'Admin Panel', path: '/admin', icon: Shield },
      { label: 'Academic Calendar', path: '/calendar', icon: CalendarIcon },
      { label: 'Announcements', path: '/announcements', icon: Megaphone },
      { label: 'Syllabus', path: '/syllabus', icon: BookOpen },
      { label: 'Timetable', path: '/timetable', icon: Clock },
      { label: 'Materials', path: '/materials', icon: FileText },
      { label: 'Quizzes', path: '/quiz-manage', icon: Gamepad2 },
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'Reminders', path: '/reminders', icon: Clock },
    ];
  };

  const navItems = getNavItems();

  const getRoleColor = () => {
    if (user.role === 'ADMIN') return 'error';
    if (user.role === 'TEACHER') return 'success';
    return 'primary';
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <StudySphereLogo
            size={38}
            showText={!collapsed || isMobile}
            subtitle="AI-Powered College Learning Platform"
          />
        </Link>

        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small" sx={{ color: 'text.secondary' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        )}
      </Box>

      {/* User Mini Profile */}
      {(!collapsed || isMobile) && (
        <Box
          sx={{
            m: 2,
            p: 1.5,
            borderRadius: '12px',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: 'primary.main',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', noWrap: true }}>
              {user.name}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={getRoleColor()}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, mt: 0.3 }}
            />
          </Box>
        </Box>
      )}

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.6 }}>
              <Tooltip title={collapsed && !isMobile ? item.label : ''} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    borderRadius: '10px',
                    py: 1,
                    px: collapsed && !isMobile ? 1.5 : 2,
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? '#ffffff' : 'text.primary',
                    boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed && !isMobile ? 0 : 36,
                      color: isActive ? '#ffffff' : 'text.secondary',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>

                  {(!collapsed || isMobile) && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 700 : 500,
                      }}
                    />
                  )}

                  {(!collapsed || isMobile) && item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'secondary.main',
                        color: '#ffffff',
                      }}
                    />
                  )}

                  {(!collapsed || isMobile) && item.count > 0 && (
                    <Chip
                      label={item.count}
                      size="small"
                      color="error"
                      sx={{ height: 18, fontSize: '0.68rem', fontWeight: 800 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Footer / Logout */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            color: 'error.main',
            py: 1,
            px: collapsed && !isMobile ? 1.5 : 2,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            '&:hover': { bgcolor: 'error.light', color: 'error.dark' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed && !isMobile ? 0 : 36, color: 'inherit' }}>
            <LogOut size={20} />
          </ListItemIcon>
          {(!collapsed || isMobile) && (
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile Sidebar Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            transition: 'width 0.25s ease',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main App Container */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { md: 'none' } }}
              >
                <MenuIcon size={22} />
              </IconButton>

              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <StudySphereLogo size={30} showText subtitle={null} />
              </Box>
            </Box>

            {/* Header Right Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Theme Toggle Button */}
              <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton onClick={toggleTheme} color="inherit" sx={{ bgcolor: 'action.hover' }}>
                  {mode === 'dark' ? <Sun size={19} color="#fbbf24" /> : <Moon size={19} color="#6366f1" />}
                </IconButton>
              </Tooltip>

              {/* User Menu Trigger */}
              <IconButton
                onClick={(e) => setAnchorElUser(e.currentTarget)}
                sx={{ p: 0.5, ml: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={() => setAnchorElUser(null)}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 210,
                    borderRadius: '14px',
                    p: 1,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <MenuItem
                  onClick={() => {
                    setAnchorElUser(null);
                    navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'TEACHER' ? '/teacher' : '/student');
                  }}
                >
                  <ListItemIcon>
                    <User size={18} />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorElUser(null);
                    handleLogout();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <LogOut size={18} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Body with Framer Motion Transition */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}
