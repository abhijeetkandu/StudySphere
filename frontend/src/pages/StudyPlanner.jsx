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
  Checkbox,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  CheckCircle2,
  Trash2,
  Plus,
  Edit2,
  Filter,
  Layers,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function StudyPlanner() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Generator, 1: Saved Plans

  // Generator Form State
  const [title, setTitle] = useState('Exam Mastery Plan');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [preferredTime, setPreferredTime] = useState('Morning (6 AM - 12 PM)');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [prioritySubjectNames, setPrioritySubjectNames] = useState([]);
  const [customTopics, setCustomTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Preview State
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Saved Plans State
  const [savedPlans, setSavedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Task Add / Edit Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    studyDate: '',
    subject: '',
    topic: '',
    taskDescription: '',
    plannedDurationMinutes: 60,
  });

  const [deletePlanTarget, setDeletePlanTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') {
        navigate('/');
      } else {
        setUser(parsedUser);
        loadSubjects(parsedUser.id);
        loadSavedPlans(parsedUser.id);
      }
    } else {
      navigate('/login');
    }

    const d = new Date();
    d.setDate(d.getDate() + 14);
    setExamDate(d.toISOString().split('T')[0]);
  }, [navigate]);

  const loadSubjects = async (studentId) => {
    try {
      const res = await fetch(`/api/student/${studentId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.enrolledSubjects && data.enrolledSubjects.length > 0) {
          setAvailableSubjects(data.enrolledSubjects);
          setSelectedSubjectIds(data.enrolledSubjects.map((s) => s.id));
          return;
        }
      }
      const subRes = await fetch('/api/admin/subjects');
      if (subRes.ok) {
        const subs = await subRes.json();
        setAvailableSubjects(subs);
        setSelectedSubjectIds(subs.map((s) => s.id));
      }
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  const loadSavedPlans = async (studentId) => {
    try {
      const res = await fetch(`/api/study-plans/student/${studentId}`);
      if (res.ok) {
        const plans = await res.json();
        setSavedPlans(plans);
        if (plans.length > 0 && !selectedPlan) {
          loadPlanDetails(plans[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load saved plans', err);
    }
  };

  const loadPlanDetails = async (planId) => {
    try {
      const res = await fetch(`/api/study-plans/${planId}`);
      if (res.ok) {
        const fullPlan = await res.json();
        setSelectedPlan(fullPlan);
      }
    } catch (err) {
      console.error('Failed to load plan details', err);
    }
  };

  const handleToggleSubject = (subId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleTogglePriority = (subName) => {
    setPrioritySubjectNames((prev) =>
      prev.includes(subName) ? prev.filter((n) => n !== subName) : [...prev, subName]
    );
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (selectedSubjectIds.length === 0) {
      showError('Please select at least one subject for the study plan.');
      return;
    }

    const todayStr = getTodayDateString();
    if (examDate && examDate < todayStr) {
      showError('Target exam date cannot be in the past. Please select today or a future date.');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedNames = availableSubjects
        .filter((s) => selectedSubjectIds.includes(s.id))
        .map((s) => s.name);

      const payload = {
        studentId: user.id,
        title: title.trim(),
        examDate,
        dailyAvailableHours: parseFloat(hoursPerDay) || 3,
        preferredStudyTime: preferredTime,
        subjects: selectedNames,
        prioritySubjects: prioritySubjectNames,
        customTopicsPrompt: customTopics.trim(),
      };

      const res = await fetch('/api/study-plans/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const plan = await res.json();
        setGeneratedPlan(plan);
        showSuccess('AI study schedule generated successfully! Review below.');
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.message || 'Failed to generate AI study plan. Please try again.');
      }
    } catch {
      showError('Network error during study plan generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedPlan),
      });

      if (res.ok) {
        const saved = await res.json();
        showSuccess('Study plan saved to your active schedules!');
        setGeneratedPlan(null);
        setActiveTab(1);
        loadSavedPlans(user.id);
        loadPlanDetails(saved.id);
      } else {
        showError('Failed to save study plan');
      }
    } catch {
      showError('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await fetch(`/api/study-plans/tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        if (selectedPlan) {
          loadPlanDetails(selectedPlan.id);
          loadSavedPlans(user.id);
        }
      }
    } catch (err) {
      console.error('Error toggling task completion', err);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    try {
      const res = await fetch(`/api/study-plans/${deletePlanTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Study plan deleted');
        setDeletePlanTarget(null);
        setSelectedPlan(null);
        loadSavedPlans(user.id);
      }
    } catch {
      showError('Network error');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const todayStr = getTodayDateString();
    if (newTaskData.studyDate && newTaskData.studyDate < todayStr) {
      showError('Study task date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const res = await fetch(`/api/study-plans/${selectedPlan.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData),
      });

      if (res.ok) {
        showSuccess('Task added to schedule');
        setShowAddTaskModal(false);
        setNewTaskData({
          studyDate: '',
          subject: '',
          topic: '',
          taskDescription: '',
          plannedDurationMinutes: 60,
        });
        loadPlanDetails(selectedPlan.id);
        loadSavedPlans(user.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.message || 'Failed to add task');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;

  // Task filtering logic
  const tasks = selectedPlan?.tasks || [];
  const uniqueSubjects = ['ALL', ...new Set(tasks.map((t) => t.subject).filter(Boolean))];

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && t.completed) ||
      (statusFilter === 'PENDING' && !t.completed);
    const matchesSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;
    return matchesStatus && matchesSubject;
  });

  // Group tasks by date
  const groupedTasks = filteredTasks.reduce((acc, t) => {
    const dateKey = t.studyDate || 'Unscheduled';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  const planProgress =
    selectedPlan?.totalTasks > 0
      ? Math.round(((selectedPlan?.completedTasks || 0) / selectedPlan?.totalTasks) * 100)
      : 0;

  return (
    <Box>
      <PageHeader
        title="AI Study Planner & Daily Routine"
        subtitle="Generate tailored revision timetables, track daily learning milestones, and manage preparation goals"
        icon={Sparkles}
      />

      {/* Tabs */}
      <Card sx={{ mb: 3.5 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 700,
              fontSize: '0.9rem',
            },
          }}
        >
          <Tab label="AI Plan Generator 🤖" icon={<Sparkles size={18} />} iconPosition="start" />
          <Tab
            label={`My Saved Plans (${savedPlans.length})`}
            icon={<ListTodo size={18} />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* TAB 0: AI GENERATOR */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ p: { xs: 3, sm: 4 }, mb: 4, borderRadius: '20px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sparkles size={22} color="#6366f1" /> Configure Your Academic Goals
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5 }}>
              StudySphere's algorithm balances subjects, topics, and difficulty levels across your daily schedule.
            </Typography>

            <form onSubmit={handleGeneratePlan}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                <TextField
                  label="Plan Title"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <TextField
                  label="Target Exam / Completion Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getTodayDateString() }}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />

                <TextField
                  label="Daily Available Study Time (Hours)"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1, max: 12, step: 0.5 }}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                />

                <TextField
                  select
                  label="Preferred Study Window"
                  fullWidth
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                >
                  <MenuItem value="Early Morning (5 AM - 9 AM)">Early Morning (5 AM - 9 AM)</MenuItem>
                  <MenuItem value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</MenuItem>
                  <MenuItem value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</MenuItem>
                  <MenuItem value="Evening (5 PM - 9 PM)">Evening (5 PM - 9 PM)</MenuItem>
                  <MenuItem value="Late Night (9 PM - 2 AM)">Late Night (9 PM - 2 AM)</MenuItem>
                </TextField>
              </Box>

              {/* Subject Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Select Enrolled Subjects to Include:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                  {availableSubjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <Chip
                        key={sub.id}
                        label={sub.name}
                        clickable
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => handleToggleSubject(sub.id)}
                        sx={{ fontWeight: 700, py: 2, px: 0.5 }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Priority Subjects */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  High-Priority / Weak Subjects (Will receive extra focus):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                  {availableSubjects
                    .filter((s) => selectedSubjectIds.includes(s.id))
                    .map((sub) => {
                      const isPriority = prioritySubjectNames.includes(sub.name);
                      return (
                        <Chip
                          key={sub.id}
                          label={`⭐ ${sub.name}`}
                          clickable
                          color={isPriority ? 'warning' : 'default'}
                          variant={isPriority ? 'filled' : 'outlined'}
                          onClick={() => handleTogglePriority(sub.name)}
                          sx={{ fontWeight: 700 }}
                        />
                      );
                    })}
                </Box>
              </Box>

              {/* Custom Prompt */}
              <TextField
                label="Custom Topics or Notes (Optional)"
                placeholder="e.g. Focus specifically on Dynamic Programming, Graph Algorithms, and SQL Joins"
                multiline
                rows={3}
                fullWidth
                value={customTopics}
                onChange={(e) => setCustomTopics(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isGenerating}
                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Sparkles size={20} />}
                sx={{
                  py: 1.4,
                  px: 4,
                  fontWeight: 800,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                }}
              >
                {isGenerating ? 'AI Generating Custom Plan...' : 'Generate AI Study Schedule'}
              </Button>
            </form>
          </Card>

          {/* Generated Plan Preview */}
          {generatedPlan && (
            <Card sx={{ p: { xs: 3, sm: 4 }, borderRadius: '20px', border: '2px solid #6366f1' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Preview: {generatedPlan.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Target Exam Date: <strong>{generatedPlan.examDate}</strong> • {generatedPlan.tasks?.length || 0} Scheduled Tasks
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <CheckCircle2 size={18} />}
                  onClick={handleSavePlan}
                  sx={{ fontWeight: 800 }}
                >
                  {isSaving ? 'Saving...' : 'Save & Activate Plan'}
                </Button>
              </Box>

              {/* Preview Tasks */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {generatedPlan.tasks?.map((t, idx) => (
                  <Card
                    key={idx}
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'action.hover',
                      borderLeft: '4px solid #6366f1',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={t.studyDate} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {t.subject} - {t.topic}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>
                        {t.taskDescription}
                      </Typography>
                    </Box>
                    <Chip label={`${t.plannedDurationMinutes}m`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Card>
                ))}
              </Box>
            </Card>
          )}
        </Box>
      )}

      {/* TAB 1: SAVED PLANS */}
      {activeTab === 1 && (
        <Box>
          {savedPlans.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No Study Plans Created"
              description="Use the AI Plan Generator above to create your first customized academic schedule."
              actionText="Generate AI Plan"
              onAction={() => setActiveTab(0)}
              actionIcon={Sparkles}
            />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 3 }}>
              {/* Plans Sidebar */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Active Schedules
                </Typography>

                {savedPlans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id;
                  const prog = p.totalTasks > 0 ? Math.round(((p.completedTasks || 0) / p.totalTasks) * 100) : 0;

                  return (
                    <Card
                      key={p.id}
                      onClick={() => loadPlanDetails(p.id)}
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {p.title}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePlanTarget(p);
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>

                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                        📅 Target: {p.examDate}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          {p.completedTasks || 0} / {p.totalTasks || 0} ({prog}%)
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={prog} sx={{ height: 6, borderRadius: 3 }} />
                    </Card>
                  );
                })}
              </Box>

              {/* Plan Task Timeline Area */}
              {selectedPlan && (
                <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '20px' }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {selectedPlan.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                        Target: <strong>{selectedPlan.examDate}</strong> • Progress: <strong>{planProgress}%</strong>
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={() => setShowAddTaskModal(true)}
                    >
                      Add Custom Task
                    </Button>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={planProgress}
                    sx={{ height: 10, borderRadius: 5, mb: 3.5 }}
                  />

                  {/* Filter Row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {['ALL', 'PENDING', 'COMPLETED'].map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          clickable
                          color={statusFilter === s ? 'primary' : 'default'}
                          onClick={() => setStatusFilter(s)}
                          sx={{ fontWeight: 700 }}
                        />
                      ))}
                    </Box>

                    <TextField
                      select
                      size="small"
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      sx={{ minWidth: 160 }}
                    >
                      {uniqueSubjects.map((sub) => (
                        <MenuItem key={sub} value={sub}>
                          {sub === 'ALL' ? 'All Subjects' : sub}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Grouped Daily Schedule */}
                  {Object.keys(groupedTasks).length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No Tasks Found"
                      description="No study tasks matched your filter criteria."
                    />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(groupedTasks).map(([date, dateTasks]) => (
                        <Box key={date}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon size={16} /> {date} ({dateTasks.length} Tasks)
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {dateTasks.map((t) => (
                              <Card
                                key={t.id}
                                sx={{
                                  p: 2,
                                  borderRadius: '12px',
                                  bgcolor: t.completed ? 'action.hover' : 'background.paper',
                                  border: '1px solid',
                                  borderColor: t.completed ? 'divider' : 'primary.light',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                <Checkbox
                                  checked={t.completed}
                                  onChange={() => handleToggleTask(t.id)}
                                  color="success"
                                />

                                <Box sx={{ flex: 1, opacity: t.completed ? 0.6 : 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                                    <Chip label={t.subject} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 700,
                                        textDecoration: t.completed ? 'line-through' : 'none',
                                      }}
                                    >
                                      {t.topic}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {t.taskDescription}
                                  </Typography>
                                </Box>

                                <Chip label={`${t.plannedDurationMinutes} min`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Card>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Add Task Modal */}
      <Dialog open={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Study Task</DialogTitle>
        <form onSubmit={handleAddTask}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Study Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getTodayDateString() }}
              value={newTaskData.studyDate}
              onChange={(e) => setNewTaskData({ ...newTaskData, studyDate: e.target.value })}
            />

            <TextField
              label="Subject"
              fullWidth
              required
              value={newTaskData.subject}
              onChange={(e) => setNewTaskData({ ...newTaskData, subject: e.target.value })}
            />

            <TextField
              label="Topic Focus"
              fullWidth
              required
              value={newTaskData.topic}
              onChange={(e) => setNewTaskData({ ...newTaskData, topic: e.target.value })}
            />

            <TextField
              label="Task Details & Notes"
              multiline
              rows={3}
              fullWidth
              required
              value={newTaskData.taskDescription}
              onChange={(e) => setNewTaskData({ ...newTaskData, taskDescription: e.target.value })}
            />

            <TextField
              label="Duration (Minutes)"
              type="number"
              fullWidth
              required
              value={newTaskData.plannedDurationMinutes}
              onChange={(e) => setNewTaskData({ ...newTaskData, plannedDurationMinutes: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletePlanTarget)}
        title="Delete Study Plan"
        message={`Are you sure you want to delete the plan "${deletePlanTarget?.title}"?`}
        onConfirm={handleDeletePlan}
        onCancel={() => setDeletePlanTarget(null)}
      />
    </Box>
  );
}
