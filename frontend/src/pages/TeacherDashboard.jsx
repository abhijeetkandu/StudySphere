import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Checkbox,
  Avatar,
  Grid,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  FileText,
  Gamepad2,
  Calendar as CalendarIcon,
  Megaphone,
  Bell,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    assignedSubjects: [],
    totalStudents: 0,
    todaysClasses: [],
    quizzes: [],
    studyMaterials: [],
  });
  const [reminders, setReminders] = useState({ today: [], overdue: [], upcoming: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'TEACHER' && parsedUser.role !== 'ADMIN') {
        navigate('/');
      } else {
        setUser(parsedUser);
        loadAllData(parsedUser.id);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const loadAllData = async (userId) => {
    setLoading(true);
    try {
      const [dashRes, remRes, annRes, calRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/teacher/${userId}/dashboard`),
        fetch(`${API_BASE_URL}/api/reminders/user/${userId}`),
        fetch(`${API_BASE_URL}/api/announcements/user/${userId}`),
        fetch(`${API_BASE_URL}/api/calendar/upcoming/${userId}?limit=3`),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (remRes.ok) setReminders(await remRes.json());
      if (annRes.ok) setAnnouncements((await annRes.json()) || []);
      if (calRes.ok) setUpcomingEvents((await calRes.json()) || []);
    } catch (err) {
      console.error('Error fetching teacher dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (remId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders/${remId}/toggle`, { method: 'PATCH' });
      if (res.ok && user) {
        const remRes = await fetch(`${API_BASE_URL}/api/reminders/user/${user.id}`);
        if (remRes.ok) setReminders(await remRes.json());
      }
    } catch (err) {
      console.error('Error toggling reminder', err);
    }
  };

  if (!user) return null;
  if (loading) return <LoadingSkeleton type="dashboard" />;

  const totalOverdue = reminders.overdue?.length || 0;
  const totalToday = reminders.today?.length || 0;
  const activeRemindersCount = totalOverdue + totalToday;

  return (
    <Box>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card
          sx={{
            mb: 3.5,
            p: { xs: 2.5, sm: 3.5 },
            background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%)',
            color: '#ffffff',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -8px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.9rem' } }}>
                    Professor {user.name}
                  </Typography>
                  <Chip
                    label="Faculty / Teacher"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Faculty Portal • StudySphere Institutional Academic Management System
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/quiz-manage"
                variant="contained"
                startIcon={<Gamepad2 size={18} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#059669',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                }}
              >
                Manage Quizzes
              </Button>
              <Button
                component={Link}
                to="/materials"
                variant="contained"
                startIcon={<Plus size={18} />}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  color: '#ffffff',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.3)' },
                }}
              >
                Upload Resource
              </Button>
            </Box>
          </Box>
        </Card>
      </motion.div>

      {/* KPI Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
        <StatCard
          title="Assigned Subjects"
          value={dashboardData.assignedSubjects?.length || 0}
          subtitle="Courses in instruction"
          icon={BookOpen}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          color="#10b981"
          onClick={() => navigate('/syllabus')}
        />
        <StatCard
          title="Total Students"
          value={dashboardData.totalStudents || 0}
          subtitle="Active course enrollments"
          icon={Users}
          gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          color="#06b6d4"
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          title="Classes Today"
          value={dashboardData.todaysClasses?.length || 0}
          subtitle={dashboardData.todaysClasses?.length > 0 ? 'Upcoming lectures' : 'No lectures today'}
          icon={Clock}
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          color="#6366f1"
          badge={dashboardData.todaysClasses?.length > 0 ? 'Active' : undefined}
          badgeColor="primary"
          onClick={() => navigate('/timetable')}
        />
        <StatCard
          title="Teaching Reminders"
          value={activeRemindersCount}
          subtitle={totalOverdue > 0 ? `${totalOverdue} overdue deadlines` : 'All tasks up to date'}
          icon={Bell}
          gradient={totalOverdue > 0 ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}
          color={totalOverdue > 0 ? '#f43f5e' : '#f59e0b'}
          badge={totalOverdue > 0 ? `${totalOverdue} Overdue` : undefined}
          badgeColor="error"
          onClick={() => navigate('/reminders')}
        />
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="#10b981" /> Faculty Quick Actions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {[
            { label: 'Manage Quizzes', path: '/quiz-manage', icon: Gamepad2, color: '#f59e0b', desc: 'AI & Manual' },
            { label: 'Syllabus', path: '/syllabus', icon: BookOpen, color: '#10b981', desc: 'Units & Topics' },
            { label: 'Timetable', path: '/timetable', icon: Clock, color: '#6366f1', desc: 'Weekly Classes' },
            { label: 'Materials', path: '/materials', icon: FileText, color: '#06b6d4', desc: 'Notes & Links' },
            { label: 'Announcements', path: '/announcements', icon: Megaphone, color: '#8b5cf6', desc: 'Post Updates' },
            { label: 'Class Analytics', path: '/analytics', icon: BarChart3, color: '#3b82f6', desc: 'Submissions' },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Card
                key={idx}
                component={Link}
                to={tool.path}
                className="hover-lift"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { borderColor: tool.color },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: `${tool.color}15`,
                    color: tool.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                  {tool.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                  {tool.desc}
                </Typography>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Main Grid: Today's Classes & Assigned Subjects */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Today's Classes */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={20} color="#10b981" /> Today's Teaching Schedule
            </Typography>
            <Button component={Link} to="/timetable" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Timetable
            </Button>
          </Box>

          {dashboardData.todaysClasses?.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No lectures scheduled today"
              description="You have no classes to conduct today."
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {dashboardData.todaysClasses.map((cls) => (
                <Box
                  key={cls.id}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid #10b981',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {cls.subject}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Room: <strong>{cls.classroom}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    label={`${cls.startTime} - ${cls.endTime}`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Card>

        {/* Assigned Subjects Overview */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookOpen size={20} color="#6366f1" /> Assigned Subjects
            </Typography>
            <Button component={Link} to="/syllabus" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Syllabus
            </Button>
          </Box>

          {dashboardData.assignedSubjects?.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects assigned yet"
              description="Contact the institutional administrator to assign courses."
            />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1.5 }}>
              {dashboardData.assignedSubjects.map((sub) => (
                <Box
                  key={sub.id}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Chip
                    label={sub.code}
                    size="small"
                    color="primary"
                    sx={{ mb: 1, fontWeight: 700, fontSize: '0.72rem' }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {sub.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>

      {/* Deadlines & Announcements */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Deadlines & Reminders */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bell size={20} color="#f59e0b" /> Teaching Deadlines & Reminders
            </Typography>
            <Button component={Link} to="/reminders" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Reminders
            </Button>
          </Box>

          {(!reminders.overdue?.length && !reminders.today?.length && !reminders.upcoming?.length) ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending deadlines"
              description="Great job staying organized!"
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {reminders.overdue?.map((rem) => (
                <Box
                  key={rem.id}
                  sx={{
                    p: 1.25,
                    borderRadius: '10px',
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Checkbox
                    checked={rem.completed}
                    onChange={() => handleToggleReminder(rem.id)}
                    color="error"
                    size="small"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#991b1b' }}>
                      {rem.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                      Overdue ({rem.reminderDate} at {rem.reminderTime})
                    </Typography>
                  </Box>
                </Box>
              ))}

              {reminders.today?.map((rem) => (
                <Box
                  key={rem.id}
                  sx={{
                    p: 1.25,
                    borderRadius: '10px',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderLeft: '3px solid #06b6d4',
                  }}
                >
                  <Checkbox
                    checked={rem.completed}
                    onChange={() => handleToggleReminder(rem.id)}
                    color="primary"
                    size="small"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {rem.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Today at {rem.reminderTime}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Card>

        {/* Announcements */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Megaphone size={20} color="#8b5cf6" /> Faculty Announcements
            </Typography>
            <Button component={Link} to="/announcements" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Post Announcement
            </Button>
          </Box>

          {announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No recent announcements"
              description="Post updates for students or your department."
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {announcements.slice(0, 3).map((ann) => (
                <Box
                  key={ann.id}
                  sx={{
                    p: 1.75,
                    borderRadius: '12px',
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {ann.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {ann.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}
