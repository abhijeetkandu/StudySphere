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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Sparkles,
  Plus,
  Trash2,
  Trophy,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Send,
  BrainCircuit,
  Sliders,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function QuizManagement() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [activeTab, setActiveTab] = useState(0); // 0: Manage, 1: AI Generator
  const [quizTitle, setQuizTitle] = useState('');

  // Question Management Modal
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionData, setQuestionData] = useState({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
  });

  // Leaderboard Modal
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTitle, setLeaderboardTitle] = useState('');

  // AI Generator States
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'TEACHER' && parsedUser.role !== 'ADMIN') navigate('/');
      else setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetch('/api/admin/courses').then((res) => res.json()).then(setCourses).catch(() => {});
    fetch('/api/admin/semesters').then((res) => res.json()).then(setSemesters).catch(() => {});
    fetch('/api/admin/subjects').then((res) => res.json()).then(setSubjects).catch(() => {});
  }, []);

  const loadQuizzes = (subId) => {
    if (!subId) {
      setQuizzes([]);
      return;
    }
    fetch(`/api/quizzes/subject/${subId}`)
      .then((res) => res.json())
      .then(setQuizzes)
      .catch(() => showError('Failed to load quizzes'));
  };

  useEffect(() => {
    loadQuizzes(selectedSubject);
  }, [selectedSubject]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim() || !selectedSubject) return;
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quizTitle.trim(), subjectId: selectedSubject, teacherId: user.id }),
      });
      if (res.ok) {
        showSuccess('Quiz created successfully');
        setQuizTitle('');
        loadQuizzes(selectedSubject);
      } else {
        showError('Failed to create quiz');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuiz) return;
    try {
      const res = await fetch(`/api/quizzes/${selectedQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (res.ok) {
        showSuccess('Question added to quiz');
        setQuestionData({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' });
        loadQuizzes(selectedSubject);
        setQuestionModalOpen(false);
      } else {
        showError('Failed to add question');
      }
    } catch {
      showError('Network error');
    }
  };

  const togglePublish = async (quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !quiz.isPublished }),
      });
      if (res.ok) {
        showSuccess(quiz.isPublished ? 'Quiz unpublished (Draft)' : 'Quiz published live for students!');
        loadQuizzes(selectedSubject);
      } else {
        showError('Failed to toggle publish status');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/quizzes/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Quiz deleted');
        setDeleteTarget(null);
        loadQuizzes(selectedSubject);
      } else {
        showError('Failed to delete quiz');
      }
    } catch {
      showError('Network error');
    }
  };

  const viewLeaderboard = async (quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
        setLeaderboardTitle(quiz.title);
        setLeaderboardModalOpen(true);
      }
    } catch {
      showError('Failed to load scoreboard');
    }
  };

  const handleGenerateAIQuiz = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      showError('Please select a subject first.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, difficulty: aiDifficulty, numQuestions: aiNumQuestions }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedQuestions(data);
        showSuccess(`Generated ${data.length} quiz questions with AI!`);
      } else {
        showError('Failed to generate quiz. Please try again.');
      }
    } catch {
      showError('Network error during AI generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditGeneratedQuestion = (index, field, value) => {
    const updated = [...generatedQuestions];
    updated[index][field] = value;
    setGeneratedQuestions(updated);
  };

  const handleRemoveGeneratedQuestion = (index) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== index));
  };

  const handleSaveAIQuiz = async () => {
    if (generatedQuestions.length === 0) return;
    try {
      const quizRes = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[AI] ${aiTopic} Quiz`,
          subjectId: selectedSubject,
          teacherId: user.id,
        }),
      });

      if (quizRes.ok) {
        const quizData = await quizRes.json();
        for (const q of generatedQuestions) {
          await fetch(`/api/quizzes/${quizData.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q),
          });
        }
        showSuccess('AI Quiz successfully saved as Draft!');
        setGeneratedQuestions([]);
        setAiTopic('');
        setActiveTab(0);
        loadQuizzes(selectedSubject);
      }
    } catch {
      showError('Failed to save AI Quiz');
    }
  };

  if (!user) return null;

  return (
    <Box>
      <PageHeader
        title="Quiz Management & AI Generator Hub"
        subtitle="Author interactive tests, leverage AI quiz generation, publish assessments, and review scoreboards"
        icon={Gamepad2}
      />

      {/* Selectors */}
      <Card sx={{ p: 3, mb: 3.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
          SELECT SUBJECT CONTEXT
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
          icon={Gamepad2}
          title="Select Subject Context"
          description="Choose a course, semester, and subject from above to manage or generate quizzes."
        />
      ) : (
        <Box>
          {/* Tabs */}
          <Card sx={{ mb: 3 }}>
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
              <Tab label="Manage Quizzes" icon={<Gamepad2 size={18} />} iconPosition="start" />
              <Tab label="AI Quiz Generator 🤖" icon={<Sparkles size={18} />} iconPosition="start" />
            </Tabs>
          </Card>

          {/* TAB 0: MANAGE QUIZZES */}
          {activeTab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
              {/* Create Quiz Form Card */}
              <Card sx={{ p: 3, height: 'fit-content' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Plus size={20} color="#6366f1" /> Create Manual Quiz
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                  Create an empty quiz container and add multiple-choice questions.
                </Typography>

                <form onSubmit={handleCreateQuiz}>
                  <TextField
                    label="Quiz Title"
                    fullWidth
                    required
                    placeholder="e.g. Unit 2 - Binary Search Quiz"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button type="submit" variant="contained" fullWidth size="large" sx={{ fontWeight: 700 }}>
                    Create Quiz
                  </Button>
                </form>
              </Card>

              {/* Quiz List */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gamepad2 size={20} color="#10b981" /> Quizzes for Selected Subject
                </Typography>

                {quizzes.length === 0 ? (
                  <EmptyState
                    icon={Gamepad2}
                    title="No Quizzes Created"
                    description="Create your first quiz manually or use the AI Generator."
                  />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {quizzes.map((q) => (
                      <Card
                        key={q.id}
                        sx={{
                          p: 2.5,
                          borderRadius: '14px',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 1.5,
                            mb: 1.5,
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                {q.title}
                              </Typography>
                              <Chip
                                label={q.isPublished ? 'Published' : 'Draft'}
                                size="small"
                                color={q.isPublished ? 'success' : 'default'}
                                sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {q.questionCount || 0} Questions • Created by Faculty
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Plus size={16} />}
                              onClick={() => {
                                setSelectedQuiz(q);
                                setQuestionModalOpen(true);
                              }}
                            >
                              Add Question
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color={q.isPublished ? 'warning' : 'success'}
                              onClick={() => togglePublish(q)}
                            >
                              {q.isPublished ? 'Unpublish' : 'Publish Live'}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              startIcon={<Trophy size={16} />}
                              onClick={() => viewLeaderboard(q)}
                            >
                              Scoreboard
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(q)}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            </Box>
          )}

          {/* TAB 1: AI QUIZ GENERATOR */}
          {activeTab === 1 && (
            <Box>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sparkles size={22} color="#6366f1" /> Intelligent AI Quiz Generator
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Specify a curriculum topic or chapter. StudySphere's AI will craft curriculum-aligned multiple-choice questions with answer keys.
                </Typography>

                <form onSubmit={handleGenerateAIQuiz}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' }, gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Topic / Subject Chapter"
                      fullWidth
                      required
                      placeholder="e.g. Dynamic Programming & Memoization"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />

                    <TextField
                      select
                      label="Difficulty Level"
                      fullWidth
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                    >
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard / Advanced</MenuItem>
                    </TextField>

                    <TextField
                      label="Questions Count"
                      type="number"
                      fullWidth
                      inputProps={{ min: 1, max: 20 }}
                      value={aiNumQuestions}
                      onChange={(e) => setAiNumQuestions(e.target.value)}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isGenerating}
                      startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                      sx={{
                        height: 52,
                        px: 3,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      }}
                    >
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </Box>
                </form>
              </Card>

              {/* Review Generated Questions */}
              {generatedQuestions.length > 0 && (
                <Card sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Review & Edit Generated Questions ({generatedQuestions.length})
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle2 size={18} />}
                      onClick={handleSaveAIQuiz}
                      sx={{ fontWeight: 700 }}
                    >
                      Save as Draft Quiz
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {generatedQuestions.map((q, idx) => (
                      <Card
                        key={idx}
                        sx={{
                          p: 3,
                          borderRadius: '14px',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip label={`Question ${idx + 1}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleRemoveGeneratedQuestion(idx)}
                          >
                            Remove
                          </Button>
                        </Box>

                        <TextField
                          label="Question Text"
                          fullWidth
                          multiline
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleEditGeneratedQuestion(idx, 'text', e.target.value)}
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
                          <TextField
                            label="Option A"
                            fullWidth
                            value={q.optionA}
                            onChange={(e) => handleEditGeneratedQuestion(idx, 'optionA', e.target.value)}
                          />
                          <TextField
                            label="Option B"
                            fullWidth
                            value={q.optionB}
                            onChange={(e) => handleEditGeneratedQuestion(idx, 'optionB', e.target.value)}
                          />
                          <TextField
                            label="Option C"
                            fullWidth
                            value={q.optionC}
                            onChange={(e) => handleEditGeneratedQuestion(idx, 'optionC', e.target.value)}
                          />
                          <TextField
                            label="Option D"
                            fullWidth
                            value={q.optionD}
                            onChange={(e) => handleEditGeneratedQuestion(idx, 'optionD', e.target.value)}
                          />
                        </Box>

                        <TextField
                          select
                          label="Correct Option"
                          value={q.correctOption}
                          onChange={(e) => handleEditGeneratedQuestion(idx, 'correctOption', e.target.value)}
                          sx={{ width: 160 }}
                        >
                          <MenuItem value="A">Option A</MenuItem>
                          <MenuItem value="B">Option B</MenuItem>
                          <MenuItem value="C">Option C</MenuItem>
                          <MenuItem value="D">Option D</MenuItem>
                        </TextField>
                      </Card>
                    ))}
                  </Box>
                </Card>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Add Question Modal */}
      <Dialog open={questionModalOpen} onClose={() => setQuestionModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Question to: {selectedQuiz?.title}
        </DialogTitle>
        <form onSubmit={handleAddQuestion}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Question Prompt"
              multiline
              rows={3}
              fullWidth
              required
              value={questionData.text}
              onChange={(e) => setQuestionData({ ...questionData, text: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Option A"
                fullWidth
                required
                value={questionData.optionA}
                onChange={(e) => setQuestionData({ ...questionData, optionA: e.target.value })}
              />
              <TextField
                label="Option B"
                fullWidth
                required
                value={questionData.optionB}
                onChange={(e) => setQuestionData({ ...questionData, optionB: e.target.value })}
              />
              <TextField
                label="Option C"
                fullWidth
                required
                value={questionData.optionC}
                onChange={(e) => setQuestionData({ ...questionData, optionC: e.target.value })}
              />
              <TextField
                label="Option D"
                fullWidth
                required
                value={questionData.optionD}
                onChange={(e) => setQuestionData({ ...questionData, optionD: e.target.value })}
              />
            </Box>

            <TextField
              select
              label="Correct Option Answer"
              fullWidth
              required
              value={questionData.correctOption}
              onChange={(e) => setQuestionData({ ...questionData, correctOption: e.target.value })}
            >
              <MenuItem value="A">Option A</MenuItem>
              <MenuItem value="B">Option B</MenuItem>
              <MenuItem value="C">Option C</MenuItem>
              <MenuItem value="D">Option D</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setQuestionModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Question</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Leaderboard Modal */}
      <Dialog open={leaderboardModalOpen} onClose={() => setLeaderboardModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Trophy size={22} color="#f59e0b" /> Scoreboard: {leaderboardTitle}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {leaderboard.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <EmptyState
                icon={Trophy}
                title="No Submissions Yet"
                description="No students have attempted this quiz yet."
              />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((lb) => (
                    <TableRow key={lb.rank} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {lb.rank === 1 ? '🥇 #1' : lb.rank === 2 ? '🥈 #2' : lb.rank === 3 ? '🥉 #3' : `#${lb.rank}`}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{lb.studentName}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{lb.score}%</TableCell>
                      <TableCell>{lb.timeSeconds}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLeaderboardModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All student attempts will be removed.`}
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
