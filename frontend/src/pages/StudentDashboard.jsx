import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Checkbox,
  Divider,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Clock,
  FileText,
  Bell,
  Sparkles,
  Gamepad2,
  BrainCircuit,
  Layers,
  Calendar as CalendarIcon,
  BarChart3,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    profile: {},
    enrolledSubjects: [],
    todaysClasses: [],
    recentMaterials: [],
    academicYear: '',
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
      if (parsedUser.role !== 'STUDENT') {
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
        fetch(`/api/student/${userId}/dashboard`),
        fetch(`/api/reminders/user/${userId}`),
        fetch(`/api/announcements/user/${userId}`),
        fetch(`/api/calendar/upcoming/${userId}?limit=3`),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (remRes.ok) setReminders(await remRes.json());
      if (annRes.ok) setAnnouncements((await annRes.json()) || []);
      if (calRes.ok) setUpcomingEvents((await calRes.json()) || []);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (remId) => {
    try {
      const res = await fetch(`/api/reminders/${remId}/toggle`, { method: 'PATCH' });
      if (res.ok && user) {
        const remRes = await fetch(`/api/reminders/user/${user.id}`);
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
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 60%, #06b6d4 100%)',
            color: '#ffffff',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -8px rgba(79, 70, 229, 0.4)',
          }}
        >
          {/* Subtle glow background */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 240,
              height: 240,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              filter: 'blur(30px)',
            }}
          />

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
                {dashboardData.profile?.name?.charAt(0) || user.name?.charAt(0)}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.9rem' } }}>
                    Welcome back, {dashboardData.profile?.name || user.name}!
                  </Typography>
                  <Chip
                    label="Student"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontSize: '0.92rem' }}>
                  <strong>Course:</strong> {dashboardData.profile?.course || 'Not Assigned'} •{' '}
                  <strong>Semester:</strong> {dashboardData.profile?.semester || 'Not Assigned'} •{' '}
                  <strong>Year:</strong> {dashboardData.academicYear || 'Current'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {dashboardData.profile?.email || user.email} • {dashboardData.profile?.college || 'StudySphere College'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                component={Link}
                to="/ai-assistant"
                variant="contained"
                startIcon={<BrainCircuit size={18} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#4f46e5',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                }}
              >
                Ask AI Tutor
              </Button>
            </Box>
          </Box>
        </Card>
      </motion.div>

      {/* KPI Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
        <StatCard
          title="Enrolled Subjects"
          value={dashboardData.enrolledSubjects?.length || 0}
          subtitle="Current semester syllabus"
          icon={BookOpen}
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          color="#6366f1"
          onClick={() => navigate('/syllabus')}
        />
        <StatCard
          title="Classes Today"
          value={dashboardData.todaysClasses?.length || 0}
          subtitle={dashboardData.todaysClasses?.length > 0 ? 'Upcoming lectures' : 'No classes today'}
          icon={Clock}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          color="#10b981"
          badge={dashboardData.todaysClasses?.length > 0 ? 'Active' : undefined}
          badgeColor="success"
          onClick={() => navigate('/timetable')}
        />
        <StatCard
          title="Study Materials"
          value={dashboardData.recentMaterials?.length || 0}
          subtitle="Recent notes & resources"
          icon={FileText}
          gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          color="#06b6d4"
          onClick={() => navigate('/materials')}
        />
        <StatCard
          title="Active Reminders"
          value={activeRemindersCount}
          subtitle={totalOverdue > 0 ? `${totalOverdue} overdue tasks` : 'All tasks on schedule'}
          icon={Bell}
          gradient={totalOverdue > 0 ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}
          color={totalOverdue > 0 ? '#f43f5e' : '#f59e0b'}
          badge={totalOverdue > 0 ? `${totalOverdue} Overdue` : undefined}
          badgeColor="error"
          onClick={() => navigate('/reminders')}
        />
      </Box>

      {/* Quick Launch Tools */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="#6366f1" /> Quick Study Tools
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {[
            { label: 'Quiz Arena', path: '/quiz-game', icon: Gamepad2, color: '#f59e0b', desc: 'Gamified' },
            { label: 'AI Assistant', path: '/ai-assistant', icon: BrainCircuit, color: '#6366f1', desc: '24/7 Tutor' },
            { label: 'Flashcards', path: '/flashcards', icon: Layers, color: '#06b6d4', desc: '3D Cards' },
            { label: 'Study Planner', path: '/study-planner', icon: Sparkles, color: '#10b981', desc: 'AI Schedule' },
            { label: 'Calendar', path: '/calendar', icon: CalendarIcon, color: '#8b5cf6', desc: 'Exams & Events' },
            { label: 'Analytics', path: '/analytics', icon: BarChart3, color: '#3b82f6', desc: 'Performance' },
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

      {/* Upcoming Events & Announcements Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Academic Calendar Events Banner */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon size={20} color="#8b5cf6" /> Upcoming Deadlines & Events
            </Typography>
            <Button component={Link} to="/calendar" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Calendar
            </Button>
          </Box>

          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming events"
              description="No calendar events or exam dates are scheduled right now."
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {upcomingEvents.map((ev) => (
                <Box
                  key={ev.id}
                  sx={{
                    p: 1.75,
                    borderRadius: '12px',
                    bgcolor: 'action.hover',
                    borderLeft: '4px solid #8b5cf6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <Chip
                        label={ev.eventType}
                        size="small"
                        sx={{ fontSize: '0.68rem', height: 20, fontWeight: 800, bgcolor: 'primary.light', color: 'primary.dark' }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {ev.title}
                      </Typography>
                    </Box>
                    {ev.description && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {ev.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>
                      {ev.eventDate}
                    </Typography>
                    {ev.startTime && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {ev.startTime}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Card>

        {/* Announcements Feed */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Megaphone size={20} color="#06b6d4" /> Campus Announcements
            </Typography>
          </Box>

          {announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No recent announcements"
              description="You are all caught up with faculty announcements."
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {ann.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {ann.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>

      {/* Main Bottom Grid: Timetable & Materials */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Today's Timetable */}
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={20} color="#10b981" /> Today's Timetable
            </Typography>
            <Button component={Link} to="/timetable" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
              Full Week
            </Button>
          </Box>

          {dashboardData.todaysClasses.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No classes scheduled today"
              description="Enjoy your free time or use Study Tools for revision."
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
                      Room: <strong>{cls.classroom}</strong> • Teacher: <strong>{cls.teacher || 'TBA'}</strong>
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

        {/* Recent Study Materials & Reminders */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Reminders */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bell size={20} color="#f59e0b" /> Pending Reminders
              </Typography>
              <Button component={Link} to="/reminders" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
                Manage All
              </Button>
            </Box>

            {(!reminders.overdue?.length && !reminders.today?.length && !reminders.upcoming?.length) ? (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up!"
                description="No pending reminders or tasks due today."
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
                      color: 'error.dark',
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

          {/* Recent Materials */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={20} color="#6366f1" /> Recent Materials
              </Typography>
              <Button component={Link} to="/materials" size="small" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700 }}>
                View All
              </Button>
            </Box>

            {dashboardData.recentMaterials?.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No study materials yet"
                description="Study materials uploaded by teachers will appear here."
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {dashboardData.recentMaterials?.slice(0, 3).map((mat) => (
                  <Box
                    key={mat.id}
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {mat.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {mat.subject} • {mat.uploadedDate}
                      </Typography>
                    </Box>
                    <Chip
                      label={mat.materialType}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
