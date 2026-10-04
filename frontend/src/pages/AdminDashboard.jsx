import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Shield,
  Building,
  FolderTree,
  GraduationCap,
  ListOrdered,
  BookOpen,
  Users,
  UserCheck,
  Calendar as CalendarIcon,
  Megaphone,
  BarChart3,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import Analytics from './Analytics';
import AnnouncementManagement from './AnnouncementManagement';
import AcademicCalendar from './AcademicCalendar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [counts, setCounts] = useState({
    colleges: 0,
    departments: 0,
    courses: 0,
    semesters: 0,
    subjects: 0,
    students: 0,
    teachers: 0,
  });

  const tabsConfig = [
    { label: 'Colleges', icon: Building },
    { label: 'Departments', icon: FolderTree },
    { label: 'Courses', icon: GraduationCap },
    { label: 'Semesters', icon: ListOrdered },
    { label: 'Subjects', icon: BookOpen },
    { label: 'Students', icon: Users },
    { label: 'Teachers', icon: UserCheck },
    { label: 'Calendar', icon: CalendarIcon },
    { label: 'Announcements', icon: Megaphone },
    { label: 'Analytics', icon: BarChart3 },
  ];

  const fetchSummaryCounts = async () => {
    try {
      const [colRes, deptRes, crsRes, semRes, subRes, stuRes, tchRes] = await Promise.all([
        fetch('/api/admin/colleges'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/semesters'),
        fetch('/api/admin/subjects'),
        fetch('/api/admin/users?role=STUDENT'),
        fetch('/api/admin/users?role=TEACHER'),
      ]);

      setCounts({
        colleges: colRes.ok ? (await colRes.json()).length : 0,
        departments: deptRes.ok ? (await deptRes.json()).length : 0,
        courses: crsRes.ok ? (await crsRes.json()).length : 0,
        semesters: semRes.ok ? (await semRes.json()).length : 0,
        subjects: subRes.ok ? (await subRes.json()).length : 0,
        students: stuRes.ok ? (await stuRes.json()).length : 0,
        teachers: tchRes.ok ? (await tchRes.json()).length : 0,
      });
    } catch (err) {
      console.error('Failed to load admin summary counts', err);
    }
  };

  useEffect(() => {
    fetchSummaryCounts();
  }, []);

  return (
    <Box>
      <PageHeader
        title="Institutional Administration"
        subtitle="Manage colleges, academic departments, courses, curricula, faculty, and student registries"
        icon={Shield}
      />

      {/* Top Stat Summary Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3.5 }}>
        <StatCard
          title="Colleges"
          value={counts.colleges}
          subtitle="Affiliated institutions"
          icon={Building}
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          color="#6366f1"
          onClick={() => setActiveTab(0)}
        />
        <StatCard
          title="Departments & Courses"
          value={`${counts.departments} / ${counts.courses}`}
          subtitle="Academic programs"
          icon={FolderTree}
          gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          color="#06b6d4"
          onClick={() => setActiveTab(1)}
        />
        <StatCard
          title="Active Students"
          value={counts.students}
          subtitle="Registered learners"
          icon={Users}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          color="#10b981"
          onClick={() => setActiveTab(5)}
        />
        <StatCard
          title="Faculty Members"
          value={counts.teachers}
          subtitle="Instructors & professors"
          icon={UserCheck}
          gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          color="#8b5cf6"
          onClick={() => setActiveTab(6)}
        />
      </Box>

      {/* Management Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 56,
              fontWeight: 700,
              fontSize: '0.9rem',
              textTransform: 'none',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          {tabsConfig.map((tab, idx) => {
            const Icon = tab.icon;
            return <Tab key={idx} label={tab.label} icon={<Icon size={18} />} />;
          })}
        </Tabs>
      </Card>

      {/* Tab Panels */}
      <Box>
        {activeTab === 0 && <AdminColleges onUpdate={fetchSummaryCounts} />}
        {activeTab === 1 && <AdminDepartments onUpdate={fetchSummaryCounts} />}
        {activeTab === 2 && <AdminCourses onUpdate={fetchSummaryCounts} />}
        {activeTab === 3 && <AdminSemesters onUpdate={fetchSummaryCounts} />}
        {activeTab === 4 && <AdminSubjects onUpdate={fetchSummaryCounts} />}
        {activeTab === 5 && <AdminUsers role="STUDENT" onUpdate={fetchSummaryCounts} />}
        {activeTab === 6 && <AdminUsers role="TEACHER" onUpdate={fetchSummaryCounts} />}
        {activeTab === 7 && <AcademicCalendar />}
        {activeTab === 8 && <AnnouncementManagement />}
        {activeTab === 9 && <Analytics />}
      </Box>
    </Box>
  );
}

// -------------------------------------------------------------
// Entity CRUD Components
// -------------------------------------------------------------

function AdminColleges({ onUpdate }) {
  const [colleges, setColleges] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useNotification();

  const fetchColleges = () => {
    fetch('/api/admin/colleges')
      .then((res) => res.json())
      .then(setColleges)
      .catch(() => showError('Failed to load colleges'));
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), location: location.trim() }),
      });
      if (res.ok) {
        showSuccess('College created successfully');
        setName('');
        setLocation('');
        setDialogOpen(false);
        fetchColleges();
        onUpdate?.();
      } else {
        showError('Failed to create college');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/colleges/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('College deleted');
        setDeleteTarget(null);
        fetchColleges();
        onUpdate?.();
      } else {
        showError('Failed to delete college');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search colleges..."
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
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          Add College
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState icon={Building} title="No colleges found" description="Add your first college campus." />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>College Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>#{c.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell>{c.location || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(c)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add College Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New College</DialogTitle>
        <form onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="College Name" fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Location" fullWidth required value={location} onChange={(e) => setLocation(e.target.value)} />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create College</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete College"
        message={`Are you sure you want to delete ${deleteTarget?.name}? All associated departments and courses will be affected.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

function AdminDepartments({ onUpdate }) {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useNotification();

  const fetchData = async () => {
    try {
      const [deptRes, colRes] = await Promise.all([
        fetch('/api/admin/departments'),
        fetch('/api/admin/colleges'),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (colRes.ok) {
        const colData = await colRes.json();
        setColleges(colData);
        if (colData.length > 0 && !collegeId) setCollegeId(colData[0].id);
      }
    } catch {
      showError('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), college: { id: collegeId } }),
      });
      if (res.ok) {
        showSuccess('Department created');
        setName('');
        setDialogOpen(false);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to create department');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/departments/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Department deleted');
        setDeleteTarget(null);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to delete department');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search departments..."
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
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          Add Department
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderTree} title="No departments found" description="Create an academic department." />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>College</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>#{d.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                  <TableCell>{d.college?.name || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(d)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Department Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Department</DialogTitle>
        <form onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Department Name" fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField
              label="College Campus"
              select
              fullWidth
              required
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
            >
              {colleges.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Department</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Department"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

function AdminCourses({ onUpdate }) {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useNotification();

  const fetchData = async () => {
    try {
      const [crsRes, deptRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/departments'),
      ]);
      if (crsRes.ok) setCourses(await crsRes.json());
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData);
        if (deptData.length > 0 && !departmentId) setDepartmentId(deptData[0].id);
      }
    } catch {
      showError('Failed to load courses');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), duration: duration.trim(), department: { id: departmentId } }),
      });
      if (res.ok) {
        showSuccess('Course program created');
        setName('');
        setDuration('');
        setDialogOpen(false);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to create course');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Course deleted');
        setDeleteTarget(null);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to delete course');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = courses.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search courses..."
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
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          Add Course Program
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No courses found" description="Create a degree or certificate course." />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>#{c.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell>{c.duration || 'N/A'}</TableCell>
                  <TableCell>{c.department?.name || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(c)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Course Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Course Program</DialogTitle>
        <form onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Course Name (e.g. B.Tech Computer Science)" fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Duration (e.g. 4 Years)" fullWidth required value={duration} onChange={(e) => setDuration(e.target.value)} />
            <TextField
              label="Department"
              select
              fullWidth
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.college?.name})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Course</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Course"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

function AdminSemesters({ onUpdate }) {
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [number, setNumber] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useNotification();

  const fetchData = async () => {
    try {
      const [semRes, crsRes] = await Promise.all([
        fetch('/api/admin/semesters'),
        fetch('/api/admin/courses'),
      ]);
      if (semRes.ok) setSemesters(await semRes.json());
      if (crsRes.ok) {
        const crsData = await crsRes.json();
        setCourses(crsData);
        if (crsData.length > 0 && !courseId) setCourseId(crsData[0].id);
      }
    } catch {
      showError('Failed to load semesters');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: parseInt(number), course: { id: courseId } }),
      });
      if (res.ok) {
        showSuccess('Semester created');
        setNumber('');
        setDialogOpen(false);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to create semester');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/semesters/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Semester deleted');
        setDeleteTarget(null);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to delete semester');
      }
    } catch {
      showError('Network error');
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Semesters List
        </Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          Add Semester
        </Button>
      </Box>

      {semesters.length === 0 ? (
        <EmptyState icon={ListOrdered} title="No semesters found" description="Add semesters to your courses." />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Course Program</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {semesters.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>#{s.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Semester {s.number}</TableCell>
                  <TableCell>{s.course?.name || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(s)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Semester Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Semester</DialogTitle>
        <form onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Semester Number (e.g. 1, 2, 3)" type="number" fullWidth required value={number} onChange={(e) => setNumber(e.target.value)} />
            <TextField
              label="Course"
              select
              fullWidth
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Semester</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Semester"
        message={`Are you sure you want to delete Semester ${deleteTarget?.number}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

function AdminSubjects({ onUpdate }) {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showSuccess, showError } = useNotification();

  const fetchData = async () => {
    try {
      const [subRes, semRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/semesters'),
      ]);
      if (subRes.ok) setSubjects(await subRes.json());
      if (semRes.ok) {
        const semData = await semRes.json();
        setSemesters(semData);
        if (semData.length > 0 && !semesterId) setSemesterId(semData[0].id);
      }
    } catch {
      showError('Failed to load subjects');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim(), semester: { id: semesterId } }),
      });
      if (res.ok) {
        showSuccess('Subject created');
        setName('');
        setCode('');
        setDialogOpen(false);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to create subject');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/subjects/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Subject deleted');
        setDeleteTarget(null);
        fetchData();
        onUpdate?.();
      } else {
        showError('Failed to delete subject');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search subjects by name or code..."
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
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          Add Subject
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects found" description="Add subjects to a course curriculum." />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester & Course</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Chip label={s.code} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell>
                    Sem {s.semester?.number} • {s.semester?.course?.name}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(s)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Subject Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Subject</DialogTitle>
        <form onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Subject Name" fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Subject Code (e.g. CS301)" fullWidth required value={code} onChange={(e) => setCode(e.target.value)} />
            <TextField
              label="Semester"
              select
              fullWidth
              required
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            >
              {semesters.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Sem {s.number} - {s.course?.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Subject</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Subject"
        message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.code})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

function AdminUsers({ role, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchUsers = () => {
    fetch(`/api/admin/users?role=${role}`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => showError(`Failed to load ${role}s`));
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
    if (!passwordRegex.test(teacherPassword)) {
      showError('Password must be at least 8 characters long, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&+=!).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherName.trim(),
          email: teacherEmail.trim(),
          password: teacherPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess('Faculty member added successfully');
        setTeacherName('');
        setTeacherEmail('');
        setTeacherPassword('');
        setAddDialogOpen(false);
        fetchUsers();
        onUpdate?.();
      } else {
        showError(data.error || 'Failed to add teacher');
      }
    } catch {
      showError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess(`${role} record deleted`);
        setDeleteTarget(null);
        fetchUsers();
        onUpdate?.();
      } else {
        showError('Failed to delete user');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 260 }}>
          <TextField
            placeholder={`Search ${role.toLowerCase()}s by name or email...`}
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
            sx={{ maxWidth: 360, width: '100%' }}
          />
          <Chip
            label={`${filtered.length} Registered ${role}s`}
            color={role === 'TEACHER' ? 'success' : 'primary'}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {role === 'TEACHER' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Plus size={18} />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Add Faculty Member
          </Button>
        )}
      </Box>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={`No ${role.toLowerCase()}s found`} description={`No ${role.toLowerCase()} registrations matched.`} />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>#{u.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" color={role === 'TEACHER' ? 'success' : 'primary'} sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => setDeleteTarget(u)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Teacher Dialog */}
      <Dialog open={addDialogOpen} onClose={() => !submitting && setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Faculty Member</DialogTitle>
        <form onSubmit={handleAddTeacher}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Full Name"
              fullWidth
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Dr. Robert Langdon"
            />
            <TextField
              label="Faculty Email Address"
              type="email"
              fullWidth
              required
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="e.g. robert.langdon@university.edu"
            />
            <TextField
              label="Initial Password"
              type="password"
              fullWidth
              required
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              helperText="Min 8 chars with uppercase, lowercase, number & symbol"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Faculty Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${role}`}
        message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.email})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
