import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SyllabusManagement from './pages/SyllabusManagement';
import TimetableManagement from './pages/TimetableManagement';
import StudyMaterials from './pages/StudyMaterials';
import QuizManagement from './pages/QuizManagement';
import QuizGame from './pages/QuizGame';
import AIStudyAssistant from './pages/AIStudyAssistant';
import StudyPlanner from './pages/StudyPlanner';
import Flashcards from './pages/Flashcards';
import Reminders from './pages/Reminders';
import Analytics from './pages/Analytics';
import AnnouncementManagement from './pages/AnnouncementManagement';
import AcademicCalendar from './pages/AcademicCalendar';
import AppLayout from './components/layout/AppLayout';

function RoleRedirect() {
  const storedUser = sessionStorage.getItem('user');
  if (!storedUser) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(storedUser);
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const storedUser = sessionStorage.getItem('user');
  if (!storedUser) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(storedUser);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <RoleRedirect />;
    }
    return <AppLayout>{children}</AppLayout>;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:portalRole" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Role-Protected Dashboards */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Academic Features */}
      <Route
        path="/syllabus"
        element={
          <ProtectedRoute>
            <SyllabusManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <TimetableManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <StudyMaterials />
          </ProtectedRoute>
        }
      />

      {/* Quizzes & Gamification */}
      <Route
        path="/quiz-manage"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
            <QuizManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz-game"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <QuizGame />
          </ProtectedRoute>
        }
      />

      {/* AI Study Tools */}
      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AIStudyAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-planner"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudyPlanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flashcards"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Flashcards />
          </ProtectedRoute>
        }
      />

      {/* Productivity & Institutional */}
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <Reminders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
            <AnnouncementManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AcademicCalendar />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
