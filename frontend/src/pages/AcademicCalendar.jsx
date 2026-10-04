import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Search,
  BookOpen,
  Filter,
  Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';

const EVENT_TYPES = [
  { value: 'HOLIDAY', label: 'Holiday', color: '#ef4444', bg: '#fee2e2' },
  { value: 'EXAM', label: 'Exam / Midterm', color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'ASSIGNMENT', label: 'Assignment Due', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'COLLEGE_EVENT', label: 'College Event', color: '#0284c7', bg: '#e0f2fe' },
  { value: 'LECTURE', label: 'Special Lecture', color: '#10b981', bg: '#d1fae5' },
  { value: 'DEADLINE', label: 'Project Deadline', color: '#dc2626', bg: '#ffe4e6' },
  { value: 'OTHER', label: 'Notice', color: '#64748b', bg: '#f1f5f9' },
];

export default function AcademicCalendar() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'COLLEGE_EVENT',
    startTime: '',
    endTime: '',
    academicYear: '2024-2025',
    courseId: '',
    semesterId: '',
    published: true,
  });

  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    loadEvents(parsed);
    loadCoursesAndSemesters(parsed);
  }, [navigate]);

  const loadEvents = async (currentUser) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/calendar`;
      if (currentUser.role === 'STUDENT') {
        url = `${API_BASE_URL}/api/calendar/student/${currentUser.id}`;
      } else if (currentUser.role === 'TEACHER') {
        url = `${API_BASE_URL}/api/calendar/teacher/${currentUser.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setEvents((await res.json()) || []);
      }
    } catch {
      showError('Failed to load academic calendar');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndSemesters = async (currentUser) => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER') {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/courses`),
          fetch(`${API_BASE_URL}/api/admin/semesters`),
        ]);
        if (cRes.ok) setCourses(await cRes.json());
        if (sRes.ok) setSemesters(await sRes.json());
      } catch {}
    }
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.eventDate) return;

    const todayStr = getTodayDateString();
    if (formData.eventDate < todayStr) {
      showError('Event date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const payload = {
        ...formData,
        courseId: formData.courseId || null,
        semesterId: formData.semesterId || null,
        creatorId: user.id,
      };

      let res;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/api/calendar/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showSuccess(editingId ? 'Event updated' : 'Event scheduled on calendar');
        setShowModal(false);
        setEditingId(null);
        loadEvents(user);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.error || 'Failed to save event');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/calendar/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Calendar event removed');
        setDeleteTarget(null);
        loadEvents(user);
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;
  const canManage = user.role === 'ADMIN' || user.role === 'TEACHER';

  // Month navigation calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesType = typeFilter === 'ALL' || ev.eventType === typeFilter;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDayEvents = (day) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((ev) => ev.eventDate === dStr);
  };

  const selectedDateEvents = selectedDateStr
    ? filteredEvents.filter((ev) => ev.eventDate === selectedDateStr)
    : [];

  const getTypeMeta = (t) => EVENT_TYPES.find((x) => x.value === t) || EVENT_TYPES[6];

  return (
    <Box>
      <PageHeader
        title="Academic Calendar & Event Schedule"
        subtitle="Track university exam dates, holidays, assignment deadlines, and departmental conferences"
        icon={CalendarIcon}
        action={
          canManage && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => {
                setEditingId(null);
                setFormData({
                  title: '',
                  description: '',
                  eventDate: new Date().toISOString().split('T')[0],
                  eventType: 'EXAM',
                  startTime: '10:00',
                  endTime: '13:00',
                  academicYear: '2024-2025',
                  courseId: '',
                  semesterId: '',
                  published: true,
                });
                setShowModal(true);
              }}
              sx={{ fontWeight: 700 }}
            >
              Add Calendar Event
            </Button>
          )
        }
      />

      {/* Filter & Search Bar */}
      <Card sx={{ p: 2.5, mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search calendar events..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />

        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          <Chip
            label="All Events"
            clickable
            color={typeFilter === 'ALL' ? 'primary' : 'default'}
            onClick={() => setTypeFilter('ALL')}
            sx={{ fontWeight: 700 }}
          />
          {EVENT_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              clickable
              color={typeFilter === t.value ? 'primary' : 'default'}
              variant={typeFilter === t.value ? 'filled' : 'outlined'}
              onClick={() => setTypeFilter(t.value)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      </Card>

      {/* Calendar Grid & Agenda Split */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3 }}>
        {/* Month Calendar Grid */}
        <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px' }}>
          {/* Month Header Controller */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {monthName} {year}
              </Typography>
              <Button size="small" variant="outlined" onClick={handleToday} sx={{ fontWeight: 700 }}>
                Today
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton onClick={handlePrevMonth} size="small" sx={{ bgcolor: 'action.hover' }}>
                <ChevronLeft size={20} />
              </IconButton>
              <IconButton onClick={handleNextMonth} size="small" sx={{ bgcolor: 'action.hover' }}>
                <ChevronRight size={20} />
              </IconButton>
            </Box>
          </Box>

          {/* Weekday Names */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1, textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <Typography key={i} variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                {d}
              </Typography>
            ))}
          </Box>

          {/* Days Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <Box key={`blank-${i}`} sx={{ minHeight: 80, bgcolor: 'transparent' }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getDayEvents(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;
              const isSelected = selectedDateStr === dateStr;

              return (
                <Box
                  key={day}
                  onClick={() => setSelectedDateStr(dateStr)}
                  sx={{
                    minHeight: { xs: 70, sm: 95 },
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'divider',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        color: isToday ? '#ffffff' : 'text.primary',
                      }}
                    >
                      {day}
                    </Typography>
                    {dayEvents.length > 0 && (
                      <Chip label={dayEvents.length} size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mt: 0.5 }}>
                    {dayEvents.slice(0, 2).map((ev) => {
                      const meta = getTypeMeta(ev.eventType);
                      return (
                        <Box
                          key={ev.id}
                          sx={{
                            px: 0.6,
                            py: 0.2,
                            borderRadius: '4px',
                            bgcolor: meta.bg,
                            color: meta.color,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.title}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Selected Date Agenda / Upcoming Events */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card sx={{ p: 3, borderRadius: '20px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon size={20} color="#6366f1" />
              {selectedDateStr ? `Events for ${selectedDateStr}` : 'Selected Date Events'}
            </Typography>

            {!selectedDateStr ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Click any day on the calendar to see its scheduled events.
              </Typography>
            ) : selectedDateEvents.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No Events"
                description={`No academic events scheduled for ${selectedDateStr}.`}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedDateEvents.map((ev) => {
                  const meta = getTypeMeta(ev.eventType);
                  return (
                    <Card
                      key={ev.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        borderLeft: `4px solid ${meta.color}`,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Chip
                          label={meta.label}
                          size="small"
                          sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 800, fontSize: '0.68rem' }}
                        />
                        {canManage && (
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(ev)}>
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                        {ev.title}
                      </Typography>
                      {ev.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>
                          {ev.description}
                        </Typography>
                      )}
                      {ev.startTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: 'text.secondary' }}>
                          <Clock size={13} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* Add Event Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Calendar Event' : 'Schedule Academic Event'}
        </DialogTitle>
        <form onSubmit={handleSaveEvent}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Event Title"
              fullWidth
              required
              placeholder="e.g. End Semester Theory Examination"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Event Category"
                fullWidth
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              >
                {EVENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Event Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getTodayDateString() }}
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Start Time (Optional)"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />

              <TextField
                label="End Time (Optional)"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </Box>

            <TextField
              label="Description & Event Notes"
              multiline
              rows={3}
              fullWidth
              placeholder="Provide hall details, guidelines, or instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Schedule Event</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Calendar Event"
        message={`Are you sure you want to remove "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
