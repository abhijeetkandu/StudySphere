import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  LinearProgress,
  Grid,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  BarChart3,
  Trophy,
  Target,
  Clock,
  BookOpen,
  AlertTriangle,
  Layers,
  Sparkles,
  Gamepad2,
  Users,
  GraduationCap,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      loadAnalytics(parsed);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const loadAnalytics = async (userData) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (userData.role === 'STUDENT') {
        endpoint = `/api/analytics/student/${userData.id}`;
      } else if (userData.role === 'TEACHER') {
        endpoint = `/api/analytics/teacher/${userData.id}`;
      } else if (userData.role === 'ADMIN') {
        endpoint = `/api/analytics/admin`;
      }

      if (endpoint) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;
  if (isLoading) return <LoadingSkeleton type="dashboard" />;

  // Pie chart data for student
  const pieData = analyticsData
    ? [
        { name: 'Correct Answers', value: analyticsData.totalCorrectAnswers || 0, color: '#10b981' },
        { name: 'Incorrect Answers', value: analyticsData.totalWrongAnswers || 0, color: '#f43f5e' },
      ]
    : [];

  // Bar chart data for subjects
  const subjectChartData = (analyticsData?.subjectPerformance || []).map((sub) => ({
    subject: sub.subject,
    averageScore: sub.averageScore || 0,
    accuracy: sub.accuracy || 0,
    attempts: sub.attempts || 0,
  }));

  return (
    <Box>
      <PageHeader
        title="Academic Analytics & Performance Insights"
        subtitle={`Real-time learning mastery, accuracy analytics, and progress tracking for ${user.name}`}
        icon={BarChart3}
      />

      {!analyticsData ? (
        <EmptyState
          icon={BarChart3}
          title="No Analytics Data Available"
          description="Complete quizzes, study sessions, or flashcards to generate your performance metrics."
        />
      ) : (
        <Box>
          {/* ============================================================ */}
          {/* 1. STUDENT ANALYTICS VIEW */}
          {/* ============================================================ */}
          {user.role === 'STUDENT' && (
            <Box>
              {/* KPI Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
                <StatCard
                  title="Quizzes Attempted"
                  value={analyticsData.totalQuizzesAttempted || 0}
                  subtitle={`${analyticsData.totalQuizzesCompleted || 0} completed`}
                  icon={Gamepad2}
                  gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  color="#6366f1"
                />
                <StatCard
                  title="Average Quiz Score"
                  value={`${analyticsData.averageScore || 0}%`}
                  subtitle={`Highest: ${analyticsData.highestScore || 0}%`}
                  icon={TrendingUp}
                  gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                  color="#06b6d4"
                />
                <StatCard
                  title="Accuracy Rate"
                  value={`${analyticsData.accuracyRate || 0}%`}
                  subtitle={`${analyticsData.totalCorrectAnswers || 0} correct / ${analyticsData.totalWrongAnswers || 0} wrong`}
                  icon={Target}
                  gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="#10b981"
                />
                <StatCard
                  title="Study Sessions"
                  value={analyticsData.totalStudySessions || 0}
                  subtitle={`${analyticsData.tasksCompleted || 0} tasks • ${analyticsData.flashcardMasteryPercent || 0}% flashcards`}
                  icon={Clock}
                  gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  color="#8b5cf6"
                />
              </Box>

              {/* Charts Row: Accuracy Donut & Learning Progress */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3.5 }}>
                {/* Accuracy Donut Chart */}
                <Card sx={{ p: 3, borderRadius: '20px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Target size={20} color="#10b981" /> Question Accuracy Breakdown
                  </Typography>

                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', mt: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Correct Answers
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                        {analyticsData.totalCorrectAnswers || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Incorrect Answers
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                        {analyticsData.totalWrongAnswers || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Card>

                {/* Learning Progress Mastery */}
                <Card sx={{ p: 3, borderRadius: '20px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Sparkles size={20} color="#6366f1" /> Comprehensive Learning Progress
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                    {/* AI Tasks */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          AI Study Tasks Completed
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#06b6d4' }}>
                          {analyticsData.tasksCompleted || 0} / {analyticsData.totalTasks || 0}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analyticsData.totalTasks > 0 ? ((analyticsData.tasksCompleted || 0) / analyticsData.totalTasks) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Flashcards */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Flashcard Mastery (Known Cards)
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10b981' }}>
                          {analyticsData.knownFlashcards || 0} / {analyticsData.totalFlashcards || 0} ({analyticsData.flashcardMasteryPercent || 0}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analyticsData.flashcardMasteryPercent || 0}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Quiz Completion */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Quiz Completion Ratio
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#8b5cf6' }}>
                          {analyticsData.totalQuizzesCompleted || 0} / {analyticsData.totalQuizzesAttempted || 0}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analyticsData.totalQuizzesAttempted > 0 ? ((analyticsData.totalQuizzesCompleted || 0) / analyticsData.totalQuizzesAttempted) * 100 : 0}
                        color="secondary"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                </Card>
              </Box>

              {/* Subject Performance Bar Chart */}
              <Card sx={{ p: 3, mb: 3.5, borderRadius: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookOpen size={20} color="#6366f1" /> Subject-Wise Quiz Performance & Accuracy
                </Typography>

                {subjectChartData.length === 0 ? (
                  <EmptyState icon={BookOpen} title="No Subject Quiz Records" description="Take subject quizzes in the Quiz Arena to populate this chart." />
                ) : (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="subject" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageScore" name="Average Score (%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="accuracy" name="Accuracy Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Card>

              {/* Weak Areas Recommendations */}
              {analyticsData.weakAreas && analyticsData.weakAreas.length > 0 && (
                <Card sx={{ p: 3, mb: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'error.light', bgcolor: 'rgba(244, 63, 94, 0.04)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={20} color="#f43f5e" /> Identified Weak Areas & Revision Recommended
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                    These topics scored below 60% accuracy in recent attempts. Target them in Flashcards and Study Planner:
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {analyticsData.weakAreas.map((w, idx) => (
                      <Card key={idx} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.dark', mb: 0.5 }}>
                          {w.subject}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                          Accuracy: <strong>{w.accuracy}%</strong> • Average Score: <strong>{w.averageScore}%</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          {w.recommendation}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button component={Link} to="/flashcards" size="small" variant="contained" sx={{ fontWeight: 700 }}>
                            Practice Flashcards
                          </Button>
                          <Button component={Link} to="/study-planner" size="small" variant="outlined" sx={{ fontWeight: 700 }}>
                            Add to Plan
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Recent Quiz Attempts Table */}
              <Card sx={{ p: 3, borderRadius: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={20} color="#6366f1" /> Recent Quiz Attempts History
                </Typography>

                {(!analyticsData.recentAttempts || analyticsData.recentAttempts.length === 0) ? (
                  <EmptyState icon={Gamepad2} title="No Quiz Attempts" description="Your completed quizzes will appear in this history." />
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Quiz Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Correct / Wrong</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.recentAttempts.map((att) => (
                          <TableRow key={att.id} hover>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {att.attemptDate ? att.attemptDate.replace('T', ' ').substring(0, 16) : 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{att.quizTitle}</TableCell>
                            <TableCell>
                              <Chip label={att.subject} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: (att.score || 0) >= 70 ? 'success.main' : ((att.score || 0) >= 50 ? 'warning.main' : 'error.main') }}>
                              {att.score}%
                            </TableCell>
                            <TableCell>
                              <span style={{ color: '#10b981', fontWeight: 700 }}>{att.correctAnswers || 0}</span> / <span style={{ color: '#f43f5e', fontWeight: 700 }}>{att.wrongAnswers || 0}</span>
                            </TableCell>
                            <TableCell>{att.timeSeconds ? `${att.timeSeconds}s` : 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Box>
          )}

          {/* ============================================================ */}
          {/* 2. TEACHER ANALYTICS VIEW */}
          {/* ============================================================ */}
          {user.role === 'TEACHER' && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
                <StatCard
                  title="Quizzes Authored"
                  value={analyticsData.totalQuizzesCreated || 0}
                  subtitle="Published faculty quizzes"
                  icon={BookOpen}
                  gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  color="#6366f1"
                />
                <StatCard
                  title="Total Submissions"
                  value={analyticsData.totalAttempts || 0}
                  subtitle={`${analyticsData.totalStudentsEngaged || 0} students engaged`}
                  icon={Users}
                  gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                  color="#06b6d4"
                />
                <StatCard
                  title="Class Average Score"
                  value={`${analyticsData.averageScore || 0}%`}
                  subtitle="Across all student attempts"
                  icon={TrendingUp}
                  gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="#10b981"
                />
                <StatCard
                  title="Pass Rate (≥50%)"
                  value={`${analyticsData.passRate || 0}%`}
                  subtitle="Student mastery threshold"
                  icon={Award}
                  gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  color="#8b5cf6"
                />
              </Box>

              {/* Struggling Students Alert */}
              {analyticsData.strugglingStudents && analyticsData.strugglingStudents.length > 0 && (
                <Card sx={{ p: 3, mb: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'error.light', bgcolor: 'rgba(244, 63, 94, 0.04)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={20} color="#f43f5e" /> Students Needing Academic Support (Average &lt; 50%)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                    {analyticsData.strugglingStudents.map((s) => (
                      <Card key={s.studentId} sx={{ p: 1.5, px: 2, borderRadius: '10px', border: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.dark' }}>
                          {s.studentName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Avg: <strong>{s.averageScore}%</strong> ({s.attemptsCount} quizzes)
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Student Leaderboard */}
              <Card sx={{ p: 3, borderRadius: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Trophy size={20} color="#f59e0b" /> Top Performing Students in Your Classes
                </Typography>

                {(!analyticsData.studentLeaderboard || analyticsData.studentLeaderboard.length === 0) ? (
                  <EmptyState icon={Trophy} title="No Submissions Yet" description="Student submissions will rank here." />
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Quizzes</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Average Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Highest Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.studentLeaderboard.map((s, idx) => (
                          <TableRow key={s.studentId} hover>
                            <TableCell sx={{ fontWeight: 800 }}>
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{s.studentName}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{s.email}</TableCell>
                            <TableCell>{s.attemptsCount}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'success.main' }}>{s.averageScore}%</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>{s.highestScore}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Box>
          )}

          {/* ============================================================ */}
          {/* 3. ADMIN ANALYTICS VIEW */}
          {/* ============================================================ */}
          {user.role === 'ADMIN' && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
                <StatCard
                  title="Total Students"
                  value={analyticsData.totalStudents || 0}
                  subtitle="Active institutional learners"
                  icon={Users}
                  gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                  color="#06b6d4"
                />
                <StatCard
                  title="Total Teachers"
                  value={analyticsData.totalTeachers || 0}
                  subtitle="Faculty & instructors"
                  icon={GraduationCap}
                  gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="#10b981"
                />
                <StatCard
                  title="Total Subjects"
                  value={analyticsData.totalSubjects || 0}
                  subtitle="Curricula subjects registered"
                  icon={BookOpen}
                  gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  color="#6366f1"
                />
                <StatCard
                  title="Total Quiz Attempts"
                  value={analyticsData.totalAttempts || 0}
                  subtitle={`Across ${analyticsData.totalQuizzes || 0} quizzes`}
                  icon={Gamepad2}
                  gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  color="#f59e0b"
                />
              </Box>

              <Card sx={{ p: 3.5, borderRadius: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Institutional Learning & Engagement Overview
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                  • Platform-wide Average Quiz Score: <strong>{analyticsData.overallAverageScore || 0}%</strong><br />
                  • Overall Question Accuracy Rate: <strong>{analyticsData.overallAccuracy || 0}%</strong><br />
                  • Total Study Materials Uploaded: <strong>{analyticsData.totalMaterials || 0}</strong>
                </Typography>
              </Card>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
