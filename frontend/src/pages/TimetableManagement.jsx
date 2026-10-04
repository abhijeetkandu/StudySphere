import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Chip,
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
  Clock,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  User,
  BookOpen,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function TimetableManagement() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [activeDayIndex, setActiveDayIndex] = useState(() => {
    const idx = daysOfWeek.indexOf(todayDayName);
    return idx !== -1 ? idx : 0;
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: '2024-2025',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    classroom: '',
    courseId: '',
    semesterId: '',
    subjectId: '',
    teacherId: '',
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
    fetch(`${API_BASE_URL}/api/admin/courses`).then((res) => res.json()).then(setCourses).catch(() => {});
    fetch(`${API_BASE_URL}/api/admin/semesters`).then((res) => res.json()).then(setSemesters).catch(() => {});
    fetch(`${API_BASE_URL}/api/admin/subjects`).then((res) => res.json()).then(setSubjects).catch(() => {});
    fetch(`${API_BASE_URL}/api/admin/users?role=TEACHER`).then((res) => res.json()).then(setTeachers).catch(() => {});
  }, []);

  const loadTimetables = (crsId, semId) => {
    if (!crsId || !semId) {
      setTimetables([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/timetables/course/${crsId}/semester/${semId}`)
      .then((res) => res.json())
      .then(setTimetables)
      .catch(() => showError('Failed to load timetables'));
  };

  useEffect(() => {
    loadTimetables(selectedCourse, selectedSemester);
  }, [selectedCourse, selectedSemester]);

  const handleAddTimetable = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/timetables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showSuccess('Schedule entry added');
        setModalOpen(false);
        if (formData.courseId === selectedCourse && formData.semesterId === selectedSemester) {
          loadTimetables(selectedCourse, selectedSemester);
        }
      } else {
        showError('Failed to add schedule entry');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/timetables/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Schedule slot deleted');
        setDeleteTarget(null);
        loadTimetables(selectedCourse, selectedSemester);
      } else {
        showError('Failed to delete schedule slot');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;
  const canManage = user.role === 'ADMIN' || user.role === 'TEACHER';

  const currentDay = daysOfWeek[activeDayIndex];
  const dayClasses = timetables
    .filter((t) => t.dayOfWeek === currentDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Box>
      <PageHeader
        title="Weekly Timetable & Class Schedule"
        subtitle="Manage lecture slots, classrooms, faculty allocation, and routine timings"
        icon={Clock}
        action={
          canManage && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  courseId: selectedCourse || (courses[0]?.id || ''),
                  semesterId: selectedSemester || '',
                }));
                setModalOpen(true);
              }}
            >
              Add Schedule Slot
            </Button>
          )
        }
      />

      {/* Selectors */}
      <Card sx={{ p: 3, mb: 3.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
          SELECT CLASS CONTEXT
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <TextField
            select
            label="Course Program"
            fullWidth
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedSemester('');
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
            onChange={(e) => setSelectedSemester(e.target.value)}
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
        </Box>
      </Card>

      {!selectedCourse || !selectedSemester ? (
        <EmptyState
          icon={Clock}
          title="Select Course & Semester"
          description="Choose a course program and semester above to view the weekly schedule."
        />
      ) : (
        <Box>
          {/* Day of the Week Tabs */}
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={activeDayIndex}
              onChange={(e, v) => setActiveDayIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 52,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                },
              }}
            >
              {daysOfWeek.map((day, idx) => {
                const isToday = day === todayDayName;
                const count = timetables.filter((t) => t.dayOfWeek === day).length;
                return (
                  <Tab
                    key={idx}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{day}</span>
                        {isToday && (
                          <Chip label="Today" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                        )}
                        {count > 0 && (
                          <Chip label={count} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Card>

          {/* Schedule List for Active Day */}
          {dayClasses.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={`No classes on ${currentDay}`}
              description="No lectures or lab sessions are scheduled for this day."
              actionText={canManage ? 'Schedule a Lecture' : undefined}
              onAction={() => {
                setFormData((prev) => ({
                  ...prev,
                  courseId: selectedCourse,
                  semesterId: selectedSemester,
                  dayOfWeek: currentDay,
                }));
                setModalOpen(true);
              }}
              actionIcon={Plus}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dayClasses.map((item, idx) => (
                <Card
                  key={item.id}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    borderLeft: '5px solid #10b981',
                    borderRadius: '14px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'success.light',
                        color: 'success.dark',
                        textAlign: 'center',
                        minWidth: 100,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {item.startTime}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        to {item.endTime}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                        {item.subject?.name || 'Class Lecture'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <User size={15} color="#64748b" />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {item.teacher?.name || 'Faculty TBA'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={15} color="#64748b" />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Classroom: {item.classroom}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {canManage && (
                    <IconButton
                      color="error"
                      onClick={() => setDeleteTarget(item)}
                      size="small"
                      sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  )}
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Add Timetable Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Schedule Slot</DialogTitle>
        <form onSubmit={handleAddTimetable}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Academic Year"
                fullWidth
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
              <TextField
                select
                label="Day of Week"
                fullWidth
                required
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              >
                {daysOfWeek.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Course Program"
                fullWidth
                required
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value, semesterId: '', subjectId: '' })}
              >
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
                required
                disabled={!formData.courseId}
                value={formData.semesterId}
                onChange={(e) => setFormData({ ...formData, semesterId: e.target.value, subjectId: '' })}
              >
                {semesters
                  .filter((s) => s.course && s.course.id === parseInt(formData.courseId))
                  .map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      Semester {s.number}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Subject"
                fullWidth
                required
                disabled={!formData.semesterId}
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                {subjects
                  .filter((s) => s.semester && s.semester.id === parseInt(formData.semesterId))
                  .map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                select
                label="Assigned Teacher"
                fullWidth
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
              <TextField
                label="End Time"
                type="time"
                fullWidth
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </Box>

            <TextField
              label="Classroom / Hall (e.g. Lab 4B / Room 201)"
              fullWidth
              required
              value={formData.classroom}
              onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Timetable Slot</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Schedule Slot"
        message={`Delete the ${deleteTarget?.subject?.name || 'lecture'} class on ${deleteTarget?.dayOfWeek} at ${deleteTarget?.startTime}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
