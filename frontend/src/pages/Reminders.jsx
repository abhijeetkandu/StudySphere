import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  Bell,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';

export default function Reminders() {
  const [user, setUser] = useState(null);
  const [remindersData, setRemindersData] = useState({
    all: [],
    today: [],
    upcoming: [],
    overdue: [],
    completed: [],
    counts: { total: 0, today: 0, upcoming: 0, overdue: 0, completed: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED'

  // New Reminder Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newDescription, setNewDescription] = useState('');

  // Edit Modal State
  const [editingReminder, setEditingReminder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      loadReminders(parsed.id);
    } else {
      navigate('/login');
    }

    setNewDate(new Date().toISOString().split('T')[0]);
  }, [navigate]);

  const loadReminders = async (userId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRemindersData(data);
      }
    } catch {
      showError('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const todayStr = getTodayDateString();
    if (newDate < todayStr) {
      showError('Reminder date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle.trim(),
          reminderDate: newDate,
          reminderTime: newTime || '12:00',
          description: newDescription.trim(),
        }),
      });

      if (res.ok) {
        showSuccess('Reminder created');
        setNewTitle('');
        setNewDescription('');
        setCreateModalOpen(false);
        loadReminders(user.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.message || 'Failed to create reminder');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleToggleCompletion = async (reminderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        loadReminders(user.id);
      }
    } catch {
      showError('Failed to toggle completion');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReminder) return;

    const todayStr = getTodayDateString();
    if (editingReminder.reminderDate && editingReminder.reminderDate < todayStr) {
      showError('Reminder date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders/${editingReminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingReminder.title,
          description: editingReminder.description,
          reminderDate: editingReminder.reminderDate,
          reminderTime: editingReminder.reminderTime,
        }),
      });

      if (res.ok) {
        showSuccess('Reminder updated');
        setEditingReminder(null);
        loadReminders(user.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.message || 'Failed to update reminder');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reminders/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Reminder deleted');
        setDeleteTarget(null);
        loadReminders(user.id);
      } else {
        showError('Failed to delete reminder');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;
  if (isLoading && !remindersData.all?.length) return <LoadingSkeleton type="dashboard" />;

  const getFilteredList = () => {
    switch (activeFilter) {
      case 'OVERDUE':
        return remindersData.overdue || [];
      case 'TODAY':
        return remindersData.today || [];
      case 'UPCOMING':
        return remindersData.upcoming || [];
      case 'COMPLETED':
        return remindersData.completed || [];
      case 'ALL':
      default:
        return remindersData.all || [];
    }
  };

  const displayedList = getFilteredList();

  return (
    <Box>
      <PageHeader
        title="My Reminders & Academic Tasks"
        subtitle="Stay organized with deadlines, assignment submissions, revision reminders, and lecture timings"
        icon={Bell}
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Create Reminder
          </Button>
        }
      />

      {/* KPI Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
        <StatCard
          title="Due Today"
          value={remindersData.counts?.today || 0}
          subtitle="Tasks scheduled for today"
          icon={Clock}
          gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          color="#06b6d4"
          onClick={() => setActiveFilter('TODAY')}
        />
        <StatCard
          title="Overdue Reminders"
          value={remindersData.counts?.overdue || 0}
          subtitle={remindersData.counts?.overdue > 0 ? 'Requires immediate action' : 'No overdue tasks'}
          icon={AlertCircle}
          gradient="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
          color="#f43f5e"
          badge={remindersData.counts?.overdue > 0 ? 'Action Needed' : undefined}
          badgeColor="error"
          onClick={() => setActiveFilter('OVERDUE')}
        />
        <StatCard
          title="Upcoming Deadlines"
          value={remindersData.counts?.upcoming || 0}
          subtitle="Future reminders"
          icon={CalendarIcon}
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          color="#6366f1"
          onClick={() => setActiveFilter('UPCOMING')}
        />
        <StatCard
          title="Completed Tasks"
          value={remindersData.counts?.completed || 0}
          subtitle="Successfully finished"
          icon={CheckCircle2}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          color="#10b981"
          onClick={() => setActiveFilter('COMPLETED')}
        />
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ p: 2, mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'ALL', label: `All (${remindersData.counts?.total || 0})` },
          { key: 'OVERDUE', label: `Overdue (${remindersData.counts?.overdue || 0})`, color: 'error' },
          { key: 'TODAY', label: `Today (${remindersData.counts?.today || 0})`, color: 'primary' },
          { key: 'UPCOMING', label: `Upcoming (${remindersData.counts?.upcoming || 0})` },
          { key: 'COMPLETED', label: `Completed (${remindersData.counts?.completed || 0})`, color: 'success' },
        ].map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            clickable
            color={activeFilter === f.key ? (f.color || 'primary') : 'default'}
            variant={activeFilter === f.key ? 'filled' : 'outlined'}
            onClick={() => setActiveFilter(f.key)}
            sx={{ fontWeight: 700 }}
          />
        ))}
      </Card>

      {/* Reminder Cards Grid */}
      {displayedList.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Reminders in this Category"
          description="You don't have any reminders matching this view."
          actionText="Create Reminder"
          onAction={() => setCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {displayedList.map((rem) => {
            const isOverdue = !rem.completed && new Date(`${rem.reminderDate}T${rem.reminderTime || '23:59'}`) < new Date();

            let borderLeftColor = '#6366f1';
            if (rem.completed) borderLeftColor = '#10b981';
            else if (isOverdue) borderLeftColor = '#f43f5e';

            return (
              <motion.div
                key={rem.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  sx={{
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '16px',
                    borderLeft: `5px solid ${borderLeftColor}`,
                    bgcolor: rem.completed ? 'action.hover' : 'background.paper',
                    opacity: rem.completed ? 0.7 : 1,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={rem.completed}
                          onChange={() => handleToggleCompletion(rem.id)}
                          color={rem.completed ? 'success' : 'primary'}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: 'text.primary',
                            textDecoration: rem.completed ? 'line-through' : 'none',
                          }}
                        >
                          {rem.title}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" onClick={() => setEditingReminder(rem)}>
                          <Edit2 size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(rem)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>

                    {rem.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.88rem',
                          mb: 2,
                          pl: 4.5,
                          lineHeight: 1.5,
                        }}
                      >
                        {rem.description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider', pl: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <CalendarIcon size={14} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {rem.reminderDate} at {rem.reminderTime}
                      </Typography>
                    </Box>

                    {rem.completed ? (
                      <Chip label="Completed" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                    ) : isOverdue ? (
                      <Chip label="Overdue" size="small" color="error" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                    ) : (
                      <Chip label="Pending" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                    )}
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Create Reminder Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Reminder</DialogTitle>
        <form onSubmit={handleCreateReminder}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Reminder Title"
              fullWidth
              required
              placeholder="e.g. Submit Operating Systems Lab 3"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getTodayDateString() }}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />

              <TextField
                label="Time"
                type="time"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </Box>

            <TextField
              label="Description (Optional)"
              multiline
              rows={3}
              fullWidth
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Reminder</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Reminder Modal */}
      <Dialog open={Boolean(editingReminder)} onClose={() => setEditingReminder(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Reminder</DialogTitle>
        {editingReminder && (
          <form onSubmit={handleSaveEdit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Title"
                fullWidth
                required
                value={editingReminder.title}
                onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getTodayDateString() }}
                  value={editingReminder.reminderDate}
                  onChange={(e) => setEditingReminder({ ...editingReminder, reminderDate: e.target.value })}
                />

                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={editingReminder.reminderTime}
                  onChange={(e) => setEditingReminder({ ...editingReminder, reminderTime: e.target.value })}
                />
              </Box>

              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={editingReminder.description || ''}
                onChange={(e) => setEditingReminder({ ...editingReminder, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setEditingReminder(null)}>Cancel</Button>
              <Button type="submit" variant="contained">Save Changes</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Reminder"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
