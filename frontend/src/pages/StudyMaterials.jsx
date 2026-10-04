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
  InputAdornment,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCode,
  Video,
  Link2,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Download,
  Filter,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function StudyMaterials() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materialType: 'PDF',
    url: '',
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetch('/api/admin/courses').then((res) => res.json()).then(setCourses).catch(() => {});
    fetch('/api/admin/semesters').then((res) => res.json()).then(setSemesters).catch(() => {});
    fetch('/api/admin/subjects').then((res) => res.json()).then(setSubjects).catch(() => {});
  }, []);

  const loadMaterials = (subId) => {
    if (!subId) {
      setMaterials([]);
      return;
    }
    fetch(`/api/materials/subject/${subId}`)
      .then((res) => res.json())
      .then(setMaterials)
      .catch(() => showError('Failed to load study materials'));
  };

  useEffect(() => {
    loadMaterials(selectedSubject);
  }, [selectedSubject]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subjectId: selectedSubject,
        teacherId: user.id,
      };

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showSuccess('Study material uploaded successfully');
        setFormData({ title: '', description: '', materialType: 'PDF', url: '' });
        setUploadModalOpen(false);
        loadMaterials(selectedSubject);
      } else {
        showError('Failed to upload material');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/materials/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Material deleted');
        setDeleteTarget(null);
        loadMaterials(selectedSubject);
      } else {
        showError('Failed to delete material');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;
  const canManage = user.role === 'ADMIN' || user.role === 'TEACHER';

  const getTypeMeta = (type) => {
    switch (type) {
      case 'PDF':
        return { icon: FileText, color: '#f43f5e', bg: '#ffe4e6', label: 'PDF Document' };
      case 'VIDEO':
        return { icon: Video, color: '#8b5cf6', bg: '#f3e8ff', label: 'Lecture Video' };
      case 'LINK':
        return { icon: Link2, color: '#06b6d4', bg: '#cffafe', label: 'External Link' };
      case 'NOTES':
      default:
        return { icon: FileCode, color: '#10b981', bg: '#d1fae5', label: 'Lecture Notes' };
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || m.materialType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      <PageHeader
        title="Study Materials & Notes Repository"
        subtitle="Access PDFs, lecture videos, notes, reference guides, and curated educational links"
        icon={FileText}
        action={
          canManage &&
          selectedSubject && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setUploadModalOpen(true)}
            >
              Upload Material
            </Button>
          )
        }
      />

      {/* Selector Filters */}
      <Card sx={{ p: 3, mb: 3.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
          SELECT SUBJECT REPOSITORY
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          <TextField
            select
            label="Course Program"
            fullWidth
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedSemester('');
              setSelectedSubject('');
            }}
          >
            <MenuItem value="">-- Select Course --</MenuItem>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Semester"
            fullWidth
            disabled={!selectedCourse}
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSelectedSubject('');
            }}
          >
            <MenuItem value="">-- Select Semester --</MenuItem>
            {semesters
              .filter((s) => s.course && s.course.id === parseInt(selectedCourse))
              .map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Semester {s.number}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Subject"
            fullWidth
            disabled={!selectedSemester}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <MenuItem value="">-- Select Subject --</MenuItem>
            {subjects
              .filter((s) => s.semester && s.semester.id === parseInt(selectedSemester))
              .map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </MenuItem>
              ))}
          </TextField>
        </Box>
      </Card>

      {!selectedSubject ? (
        <EmptyState
          icon={FileText}
          title="Select Subject Context"
          description="Choose a course, semester, and subject from above to browse uploaded study resources."
        />
      ) : (
        <Box>
          {/* Search & Type Filter Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Search materials by title or topic..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280 }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['ALL', 'PDF', 'VIDEO', 'LINK', 'NOTES'].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  clickable
                  color={typeFilter === t ? 'primary' : 'default'}
                  onClick={() => setTypeFilter(t)}
                  sx={{ fontWeight: 700, px: 1 }}
                />
              ))}
            </Box>
          </Box>

          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Materials Found"
              description="No resources matched your search or filter criteria."
              actionText={canManage ? 'Upload First Resource' : undefined}
              onAction={() => setUploadModalOpen(true)}
              actionIcon={Plus}
            />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {filteredMaterials.map((mat) => {
                const meta = getTypeMeta(mat.materialType);
                const Icon = meta.icon;

                return (
                  <Card
                    key={mat.id}
                    className="hover-lift"
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '16px',
                      position: 'relative',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: meta.bg,
                            color: meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={22} />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={mat.materialType}
                            size="small"
                            sx={{
                              bgcolor: meta.bg,
                              color: meta.color,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                            }}
                          />
                          {canManage && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(mat)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: '1.05rem', lineHeight: 1.3 }}>
                        {mat.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {mat.description || 'No description provided.'}
                      </Typography>
                    </Box>

                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Uploaded: <strong>{mat.uploadedDate || 'Recent'}</strong>
                        </Typography>
                        {mat.teacher && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            By: <strong>{mat.teacher}</strong>
                          </Typography>
                        )}
                      </Box>

                      <Button
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        fullWidth
                        variant="contained"
                        endIcon={<ExternalLink size={16} />}
                        sx={{ fontWeight: 700 }}
                      >
                        Open Resource
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Upload Material Modal */}
      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Study Resource</DialogTitle>
        <form onSubmit={handleAddMaterial}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Resource Title"
              fullWidth
              required
              placeholder="e.g. Unit 3 - Tree Traversal Lecture Slides"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              select
              label="Resource Type"
              fullWidth
              required
              value={formData.materialType}
              onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
            >
              <MenuItem value="PDF">PDF Document</MenuItem>
              <MenuItem value="VIDEO">Video Lecture (YouTube/Drive)</MenuItem>
              <MenuItem value="LINK">External Article / Link</MenuItem>
              <MenuItem value="NOTES">Markdown / Plain Notes</MenuItem>
            </TextField>

            <TextField
              label="Resource URL / File Link"
              type="url"
              fullWidth
              required
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />

            <TextField
              label="Description & Key Takeaways"
              multiline
              rows={3}
              fullWidth
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Upload Material</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
