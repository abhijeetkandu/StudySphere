import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  GraduationCap,
  Layers,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function SyllabusManagement() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [syllabus, setSyllabus] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Modals
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', chapterNumber: '' });

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', chapterId: '' });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, chapterId: null, name: '' });

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

  const loadSyllabus = (subId) => {
    if (!subId) {
      setSyllabus([]);
      return;
    }
    fetch(`/api/syllabus/subjects/${subId}`)
      .then((res) => res.json())
      .then(setSyllabus)
      .catch(() => showError('Failed to load syllabus'));
  };

  useEffect(() => {
    loadSyllabus(selectedSubject);
  }, [selectedSubject]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/syllabus/subjects/${selectedSubject}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChapter),
      });
      if (res.ok) {
        showSuccess('Chapter added');
        setNewChapter({ title: '', chapterNumber: '' });
        setChapterModalOpen(false);
        loadSyllabus(selectedSubject);
      } else {
        showError('Failed to add chapter');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/syllabus/chapters/${newTopic.chapterId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTopic.title, content: newTopic.content }),
      });
      if (res.ok) {
        showSuccess('Topic added');
        setNewTopic({ title: '', content: '', chapterId: '' });
        setTopicModalOpen(false);
        loadSyllabus(selectedSubject);
      } else {
        showError('Failed to add topic');
      }
    } catch {
      showError('Network error');
    }
  };

  const executeDelete = async () => {
    const { type, id, chapterId } = deleteDialog;
    try {
      if (type === 'chapter') {
        const res = await fetch(`/api/syllabus/chapters/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showSuccess('Chapter removed');
          loadSyllabus(selectedSubject);
        }
      } else if (type === 'topic') {
        const res = await fetch(`/api/syllabus/topics/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showSuccess('Topic removed');
          loadSyllabus(selectedSubject);
        }
      }
    } catch {
      showError('Network error');
    } finally {
      setDeleteDialog({ open: false, type: '', id: null, chapterId: null, name: '' });
    }
  };

  if (!user) return null;
  const canManage = user.role === 'ADMIN' || user.role === 'TEACHER';

  const selectedSubjectObj = subjects.find((s) => s.id === parseInt(selectedSubject));

  return (
    <Box>
      <PageHeader
        title="Syllabus & Curriculum"
        subtitle="Explore structured chapters, topics, learning objectives, and curriculum breakdown"
        icon={BookOpen}
        action={
          canManage &&
          selectedSubject && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => setChapterModalOpen(true)}
              >
                Add Chapter
              </Button>
              {syllabus.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<Plus size={18} />}
                  onClick={() => {
                    setNewTopic((prev) => ({ ...prev, chapterId: syllabus[0]?.id || '' }));
                    setTopicModalOpen(true);
                  }}
                >
                  Add Topic
                </Button>
              )}
            </Box>
          )
        }
      />

      {/* Course & Semester & Subject Selectors */}
      <Card sx={{ p: 3, mb: 3.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
          SELECT CURRICULUM CONTEXT
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

      {/* Syllabus Content */}
      {!selectedSubject ? (
        <EmptyState
          icon={BookOpen}
          title="Select a Subject"
          description="Choose a course program, semester, and subject from above to view its curriculum."
        />
      ) : syllabus.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Syllabus Defined"
          description="No chapters have been added for this subject yet."
          actionText={canManage ? 'Add First Chapter' : undefined}
          onAction={() => setChapterModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {selectedSubjectObj?.name}
              </Typography>
              <Chip label={selectedSubjectObj?.code} color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {syllabus.length} Chapters • {syllabus.reduce((acc, c) => acc + (c.topics?.length || 0), 0)} Topics
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {syllabus.map((chapter) => (
              <Accordion
                key={chapter.id}
                defaultExpanded
                sx={{
                  borderRadius: '16px !important',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} />}
                  sx={{
                    bgcolor: 'action.hover',
                    px: 3,
                    py: 1,
                    '& .MuiAccordionSummary-content': {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={`Unit ${chapter.chapterNumber}`}
                      color="secondary"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {chapter.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={`${chapter.topics?.length || 0} Topics`}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    {canManage && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({
                            open: true,
                            type: 'chapter',
                            id: chapter.id,
                            name: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
                          });
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                  {chapter.topics?.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      No topics added to this chapter yet.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {chapter.topics.map((topic, idx) => (
                        <Card
                          key={topic.id}
                          sx={{
                            p: 2.5,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '8px',
                                  bgcolor: 'primary.light',
                                  color: 'primary.dark',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                }}
                              >
                                {idx + 1}
                              </Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {topic.title}
                              </Typography>
                            </Box>

                            {canManage && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    type: 'topic',
                                    id: topic.id,
                                    chapterId: chapter.id,
                                    name: topic.title,
                                  })
                                }
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </Box>

                          {topic.content && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, pl: 5 }}>
                              {topic.content}
                            </Typography>
                          )}
                        </Card>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      )}

      {/* Add Chapter Dialog */}
      <Dialog open={chapterModalOpen} onClose={() => setChapterModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Syllabus Chapter</DialogTitle>
        <form onSubmit={handleAddChapter}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Chapter / Unit Number (e.g. 1)"
              type="number"
              fullWidth
              required
              value={newChapter.chapterNumber}
              onChange={(e) => setNewChapter({ ...newChapter, chapterNumber: e.target.value })}
            />
            <TextField
              label="Chapter Title (e.g. Graph Theory & Trees)"
              fullWidth
              required
              value={newChapter.title}
              onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setChapterModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Chapter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={topicModalOpen} onClose={() => setTopicModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Learning Topic</DialogTitle>
        <form onSubmit={handleAddTopic}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Select Chapter"
              fullWidth
              required
              value={newTopic.chapterId}
              onChange={(e) => setNewTopic({ ...newTopic, chapterId: e.target.value })}
            >
              {syllabus.map((ch) => (
                <MenuItem key={ch.id} value={ch.id}>
                  Unit {ch.chapterNumber}: {ch.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Topic Title (e.g. Dijkstra's Shortest Path Algorithm)"
              fullWidth
              required
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            />
            <TextField
              label="Topic Content / Description"
              multiline
              rows={4}
              fullWidth
              required
              value={newTopic.content}
              onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setTopicModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Topic</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Confirm Deletion"
        message={`Are you sure you want to remove "${deleteDialog.name}"?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteDialog({ open: false, type: '', id: null, chapterId: null, name: '' })}
      />
    </Box>
  );
}
