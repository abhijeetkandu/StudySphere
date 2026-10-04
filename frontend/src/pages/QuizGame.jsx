import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Award,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';

export default function QuizGame() {
  const [user, setUser] = useState(null);

  // Selection States
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Game States
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [isFinished, setIsFinished] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);

  const navigate = useNavigate();
  const { showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') navigate('/');
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

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/quizzes/subject/${selectedSubject}/published`)
        .then((res) => res.json())
        .then(setQuizzes)
        .catch(() => showError('Failed to load subject quizzes'));
    } else {
      setQuizzes([]);
    }
  }, [selectedSubject]);

  // Timer Ticker
  useEffect(() => {
    let timer;
    if (activeQuiz && !isFinished) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, isFinished, startTime]);

  const startQuiz = async (quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/questions`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          showError('This quiz does not have any questions yet.');
          return;
        }
        setQuestions(data);
        setActiveQuiz(quiz);
        setCurrentQuestionIndex(0);
        setScore(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setStartTime(Date.now());
        setElapsedTime(0);
        setIsFinished(false);
        setFeedback(null);
        setSelectedOption(null);
      }
    } catch {
      showError('Failed to initialize quiz');
    }
  };

  const handleAnswer = (option) => {
    if (feedback !== null) return; // Prevent double taps

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = option === currentQ.correctOption;

    setSelectedOption(option);

    if (isCorrect) {
      setFeedback('correct');
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      setWrongAnswers((prev) => prev + 1);
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        finishQuiz(
          score + (isCorrect ? 10 : 0),
          correctAnswers + (isCorrect ? 1 : 0),
          wrongAnswers + (isCorrect ? 0 : 1)
        );
      }
    }, 1200);
  };

  const finishQuiz = async (finalScore, finalCorrect, finalWrong) => {
    setIsFinished(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // Blast confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    try {
      await fetch(`/api/quizzes/${activeQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          score: finalScore,
          correctAnswers: finalCorrect,
          wrongAnswers: finalWrong,
          completionTimeSeconds: timeSpent,
        }),
      });

      const res = await fetch(`/api/quizzes/${activeQuiz.id}/leaderboard`);
      if (res.ok) setLeaderboard(await res.json());
    } catch (err) {
      console.error('Error submitting quiz attempt', err);
    }
  };

  if (!user) return null;

  const currentQ = questions[currentQuestionIndex];

  return (
    <Box>
      <PageHeader
        title="Gamified Quiz Arena"
        subtitle="Challenge yourself with interactive curriculum quizzes, earn mastery points, and climb the scoreboard"
        icon={Gamepad2}
      />

      {/* Lobby View (When Quiz Not Active & Not Finished) */}
      {!activeQuiz && !isFinished && (
        <Box>
          <Card sx={{ p: 3, mb: 3.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
              SELECT QUIZ CONTEXT
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
              title="Select Subject Arena"
              description="Choose your course, semester, and subject from above to view available quizzes."
            />
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="No Quizzes Available"
              description="Your instructor hasn't published any live quizzes for this subject yet."
            />
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Available Quizzes ({quizzes.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {quizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="hover-lift"
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: 'primary.light',
                            color: 'primary.dark',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Flame size={24} color="#6366f1" />
                        </Box>
                        <Chip label={`${quiz.questionCount || 0} Questions`} color="secondary" size="small" sx={{ fontWeight: 700 }} />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                        {quiz.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Interactive multiple choice quiz. Earn 10 points for each correct answer!
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<Play size={18} />}
                      onClick={() => startQuiz(quiz)}
                      sx={{
                        fontWeight: 800,
                        py: 1.2,
                        background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      }}
                    >
                      Play Quiz
                    </Button>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Active Quiz Player */}
      {activeQuiz && !isFinished && currentQ && (
        <Box sx={{ maxWidth: 840, mx: 'auto', mt: 2 }}>
          <Card
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: '24px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top HUD */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
                color="primary"
                sx={{ fontWeight: 800 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f43f5e', fontWeight: 800 }}>
                  <Clock size={18} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {elapsedTime}s
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10b981', fontWeight: 800 }}>
                  <Zap size={18} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {score} pts
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={((currentQuestionIndex + 1) / questions.length) * 100}
              sx={{ height: 8, borderRadius: 4, mb: 4 }}
            />

            {/* Question Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    mb: 3.5,
                    lineHeight: 1.35,
                    minHeight: 70,
                  }}
                >
                  {currentQ.text}
                </Typography>

                {/* Option Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { key: 'A', text: currentQ.optionA },
                    { key: 'B', text: currentQ.optionB },
                    { key: 'C', text: currentQ.optionC },
                    { key: 'D', text: currentQ.optionD },
                  ].map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    const isCorrectAnswer = opt.key === currentQ.correctOption;

                    let bgcolor = 'action.hover';
                    let borderColor = 'divider';
                    let textColor = 'text.primary';

                    if (feedback !== null) {
                      if (isCorrectAnswer) {
                        bgcolor = '#dcfce7';
                        borderColor = '#22c55e';
                        textColor = '#15803d';
                      } else if (isSelected && !isCorrectAnswer) {
                        bgcolor = '#ffe4e6';
                        borderColor = '#f43f5e';
                        textColor = '#b91c1c';
                      }
                    }

                    return (
                      <Card
                        key={opt.key}
                        onClick={() => handleAnswer(opt.key)}
                        sx={{
                          p: 2,
                          px: 2.5,
                          borderRadius: '14px',
                          cursor: feedback === null ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor,
                          border: '2px solid',
                          borderColor,
                          color: textColor,
                          transition: 'all 0.15s ease',
                          '&:hover':
                            feedback === null
                              ? {
                                  borderColor: 'primary.main',
                                  bgcolor: 'action.selected',
                                  transform: 'translateY(-2px)',
                                }
                              : {},
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '10px',
                            bgcolor: isSelected || isCorrectAnswer ? 'rgba(0,0,0,0.1)' : 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {opt.key}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                          {opt.text}
                        </Typography>

                        {feedback !== null && isCorrectAnswer && <CheckCircle2 size={22} color="#16a34a" />}
                        {feedback !== null && isSelected && !isCorrectAnswer && <XCircle size={22} color="#dc2626" />}
                      </Card>
                    );
                  })}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Card>
        </Box>
      )}

      {/* Completion & Scoreboard Screen */}
      {isFinished && (
        <Box sx={{ maxWidth: 840, mx: 'auto', mt: 2 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              sx={{
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '24px',
                  bgcolor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                  boxShadow: '0 10px 25px rgba(217, 119, 6, 0.25)',
                }}
              >
                <Trophy size={42} />
              </Box>

              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                Quiz Completed!
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                Awesome performance in <strong>{activeQuiz?.title}</strong>
              </Typography>

              {/* KPI Score Overview */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Final Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                    {score}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Correct
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                    {correctAnswers}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Wrong
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5 }}>
                    {wrongAnswers}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Time Spent
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {elapsedTime}s
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RotateCcw size={18} />}
                  onClick={() => {
                    setActiveQuiz(null);
                    setIsFinished(false);
                  }}
                  sx={{
                    fontWeight: 700,
                    px: 4,
                    py: 1.2,
                  }}
                >
                  Play Another Quiz
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/analytics')}
                  sx={{ fontWeight: 700 }}
                >
                  View My Analytics
                </Button>
              </Box>
            </Card>

            {/* Scoreboard / Leaderboard */}
            <Card sx={{ p: 3.5, borderRadius: '20px' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Trophy size={24} color="#f59e0b" /> Scoreboard & Class Rankings
              </Typography>

              {leaderboard.length === 0 ? (
                <EmptyState icon={Trophy} title="No Leaderboard Data" description="Scores are being synchronized." />
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((lb) => {
                        const isCurrentUser = lb.studentName === user.name;
                        return (
                          <TableRow
                            key={lb.rank}
                            sx={{
                              bgcolor: isCurrentUser ? 'primary.light' : 'transparent',
                              '&:hover': { bgcolor: isCurrentUser ? 'primary.light' : 'action.hover' },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 800 }}>
                              {lb.rank === 1 ? '🥇 1st' : lb.rank === 2 ? '🥈 2nd' : lb.rank === 3 ? '🥉 3rd' : `#${lb.rank}`}
                            </TableCell>
                            <TableCell sx={{ fontWeight: isCurrentUser ? 800 : 600 }}>
                              {lb.studentName} {isCurrentUser && <Chip label="You" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 800 }} />}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'primary.dark' }}>
                              {lb.score} pts
                            </TableCell>
                            <TableCell>{lb.timeSeconds}s</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </motion.div>
        </Box>
      )}
    </Box>
  );
}
