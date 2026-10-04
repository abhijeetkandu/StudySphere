import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Users,
  BookOpen,
  Send,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';

export default function AnnouncementManagement() {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL',
    subjectId: '',
    published: true,
  });

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
    if (parsed.role !== 'ADMIN' && parsed.role !== 'TEACHER') {
      navigate('/');
      return;
    }
    setUser(parsed);
    loadAnnouncements(parsed);
    loadSubjects(parsed);
  }, [navigate]);

  const loadAnnouncements = async (currentUser) => {
    setLoading(true);
    try {
      const url =
        currentUser.role === 'ADMIN'
          ? `${API_BASE_URL}/api/announcements`
          : `${API_BASE_URL}/api/announcements/author/${currentUser.id}`;
      const res = await fetch(url);
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch {
      showError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (currentUser) => {
    try {
      if (currentUser.role === 'ADMIN') {
        const res = await fetch(`${API_BASE_URL}/api/admin/subjects`);
        if (res.ok) setSubjects(await res.json());
      } else {
        const res = await fetch(`${API_BASE_URL}/api/teacher/${currentUser.id}/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.assignedSubjects || []);
        }
      }
    } catch {
      console.error('Error loading subjects');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetAudience: formData.targetAudience,
        subjectId: formData.subjectId || null,
        published: formData.published,
        authorId: user.id,
      };

      let res;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/api/announcements/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showSuccess(editingId ? 'Announcement updated' : 'Announcement broadcasted live');
        setFormData({ title: '', message: '', targetAudience: 'ALL', subjectId: '', published: true });
        setModalOpen(false);
        setEditingId(null);
        loadAnnouncements(user);
      } else {
        showError('Failed to save announcement');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleEdit = (ann) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      message: ann.message,
      targetAudience: ann.targetAudience || 'ALL',
      subjectId: ann.subject?.id ? String(ann.subject.id) : '',
      published: ann.published,
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements/${id}/publish`, { method: 'PATCH' });
      if (res.ok) {
        showSuccess('Publish status updated');
        loadAnnouncements(user);
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Announcement removed');
        setDeleteTarget(null);
        loadAnnouncements(user);
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <PageHeader
        title="Announcements & Broadcasts"
        subtitle="Publish campus notices, department updates, assignment guidelines, and faculty broadcasts"
        icon={Megaphone}
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setEditingId(null);
              setFormData({ title: '', message: '', targetAudience: 'ALL', subjectId: '', published: true });
              setModalOpen(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            Create Announcement
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="table" count={4} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Found"
          description="Create your first announcement to broadcast updates to students."
          actionText="Create Announcement"
          onAction={() => setModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {announcements.map((ann) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  borderLeft: `5px solid ${ann.published ? '#6366f1' : '#f59e0b'}`,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                    <Chip
                      label={ann.published ? 'Published' : 'Draft'}
                      size="small"
                      color={ann.published ? 'success' : 'default'}
                      sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                    />
                    <Chip
                      label={`Audience: ${ann.targetAudience}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    {ann.subject && (
                      <Chip
                        label={ann.subject.name}
                        size="small"
                        sx={{ bgcolor: 'action.hover', fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(ann.createdAt).toLocaleDateString()} • By {ann.author?.name || 'Faculty'}
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  {ann.title}
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, whiteSpace: 'pre-wrap', mb: 2.5 }}>
                  {ann.message}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color={ann.published ? 'warning' : 'success'}
                    onClick={() => handleTogglePublish(ann.id)}
                  >
                    {ann.published ? 'Unpublish' : 'Publish Live'}
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleEdit(ann)}>
                    Edit
                  </Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(ann)}>
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Card>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Announcement Title"
              fullWidth
              required
              placeholder="e.g. Midterm Examination Schedule Released"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Detailed Message & Instructions"
              multiline
              rows={4}
              fullWidth
              required
              placeholder="Provide context, dates, instructions, or attached notes..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Target Audience"
                fullWidth
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              >
                <MenuItem value="ALL">All Users (Students & Teachers)</MenuItem>
                <MenuItem value="STUDENTS">Students Only</MenuItem>
                <MenuItem value="TEACHERS">Teachers Only</MenuItem>
              </TextField>

              <TextField
                select
                label="Associated Subject (Optional)"
                fullWidth
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                <MenuItem value="">-- General Announcement --</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  color="primary"
                />
              }
              label="Publish immediately (notifies target audience)"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Save Changes' : 'Broadcast Announcement'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
