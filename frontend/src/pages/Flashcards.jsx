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
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Brain,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

export default function Flashcards() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Generator Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Add Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCard, setManualCard] = useState({
    frontText: '',
    backText: '',
    topic: '',
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') navigate('/');
      else {
        setUser(parsedUser);
        fetch(`${API_BASE_URL}/api/admin/subjects`)
          .then((res) => res.json())
          .then((data) => {
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0].id);
          })
          .catch(() => {});
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const loadFlashcards = async (subId) => {
    if (!subId || !user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards/student/${user.id}/subject/${subId}`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch {
      showError('Failed to load flashcard deck');
    }
  };

  useEffect(() => {
    if (selectedSubject && user) {
      loadFlashcards(selectedSubject);
    }
  }, [selectedSubject, user]);

  const handleToggleKnown = async (cardId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards/${cardId}/toggle-known`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setFlashcards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, known: !c.known } : c))
        );
      }
    } catch {
      showError('Failed to update mastery status');
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          subjectId: selectedSubject,
          frontText: manualCard.frontText.trim(),
          backText: manualCard.backText.trim(),
          topic: manualCard.topic.trim(),
        }),
      });

      if (res.ok) {
        showSuccess('Flashcard created');
        setManualModalOpen(false);
        setManualCard({ frontText: '', backText: '', topic: '' });
        loadFlashcards(selectedSubject);
      } else {
        showError('Failed to create flashcard');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleGenerateAIFlashcards = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !aiTopic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          subjectId: selectedSubject,
          topic: aiTopic.trim(),
          count: aiCount,
        }),
      });

      if (res.ok) {
        const added = await res.json();
        showSuccess(`Generated ${added.length} flashcards with AI!`);
        setAiModalOpen(false);
        setAiTopic('');
        loadFlashcards(selectedSubject);
      } else {
        showError('Failed to generate flashcards');
      }
    } catch {
      showError('Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Flashcard removed');
        setDeleteTarget(null);
        loadFlashcards(selectedSubject);
      } else {
        showError('Failed to delete card');
      }
    } catch {
      showError('Network error');
    }
  };

  if (!user) return null;

  const currentCard = flashcards[currentIndex];
  const knownCount = flashcards.filter((c) => c.known).length;
  const masteryPercent = flashcards.length > 0 ? Math.round((knownCount / flashcards.length) * 100) : 0;

  return (
    <Box>
      <PageHeader
        title="Interactive 3D Flashcards & Active Recall"
        subtitle="Master key formulas, definitions, and concepts with 3D flip card repetitions"
        icon={Layers}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Sparkles size={18} />}
              onClick={() => setAiModalOpen(true)}
              sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
            >
              Generate AI Deck
            </Button>
            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              onClick={() => setManualModalOpen(true)}
            >
              Add Card
            </Button>
          </Box>
        }
      />

      {/* Subject Filter Card */}
      <Card sx={{ p: 3, mb: 3.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            select
            label="Select Subject Deck"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{ minWidth: 280 }}
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Deck Mastery
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {knownCount} / {flashcards.length} Mastered ({masteryPercent}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={masteryPercent}
              sx={{ width: 120, height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>
      </Card>

      {/* Flashcard 3D Stage */}
      {flashcards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Deck is Empty"
          description="You don't have any flashcards for this subject yet. Generate an AI deck or create cards manually."
          actionText="Generate AI Flashcards"
          onAction={() => setAiModalOpen(true)}
          actionIcon={Sparkles}
        />
      ) : (
        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          {/* Card Indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip
              label={`Card ${currentIndex + 1} of ${flashcards.length}`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
            {currentCard?.topic && (
              <Chip label={currentCard.topic} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            )}
            <IconButton color="error" size="small" onClick={() => setDeleteTarget(currentCard)}>
              <Trash2 size={18} />
            </IconButton>
          </Box>

          {/* 3D Flipping Card */}
          <Box
            onClick={() => setIsFlipped(!isFlipped)}
            sx={{
              perspective: '1200px',
              cursor: 'pointer',
              height: 380,
              mb: 3,
            }}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Front Side */}
              <Card
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '24px',
                  p: { xs: 3, sm: 5 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '2px solid',
                  borderColor: currentCard?.known ? 'success.main' : 'divider',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label="QUESTION / CONCEPT" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Click to flip 🔄
                  </Typography>
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    textAlign: 'center',
                    color: 'text.primary',
                    my: 'auto',
                    lineHeight: 1.35,
                    fontSize: { xs: '1.4rem', sm: '1.75rem' },
                  }}
                >
                  {currentCard?.frontText}
                </Typography>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tap anywhere on the card to reveal the answer
                  </Typography>
                </Box>
              </Card>

              {/* Back Side */}
              <Card
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: '24px',
                  p: { xs: 3, sm: 5 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '2px solid #6366f1',
                  boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.25)',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label="ANSWER & EXPLANATION" size="small" color="secondary" sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Click to flip back 🔄
                  </Typography>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    textAlign: 'center',
                    color: 'text.primary',
                    my: 'auto',
                    lineHeight: 1.6,
                    fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  }}
                >
                  {currentCard?.backText}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    variant={currentCard?.known ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<ThumbsUp size={16} />}
                    onClick={(e) => handleToggleKnown(currentCard.id, e)}
                    sx={{ fontWeight: 700 }}
                  >
                    {currentCard?.known ? 'Mastered ✓' : 'Mark as Known'}
                  </Button>
                </Box>
              </Card>
            </motion.div>
          </Box>

          {/* Navigation Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              sx={{ fontWeight: 700 }}
            >
              Previous
            </Button>

            <Button
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              disabled={currentIndex === flashcards.length - 1}
              onClick={() => {
                setCurrentIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              sx={{ fontWeight: 700 }}
            >
              Next Card
            </Button>
          </Box>
        </Box>
      )}

      {/* AI Deck Generator Modal */}
      <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="#6366f1" /> Generate AI Flashcards
        </DialogTitle>
        <form onSubmit={handleGenerateAIFlashcards}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Topic / Subject Chapter"
              fullWidth
              required
              placeholder="e.g. Relational Algebra & Normalization"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />

            <TextField
              label="Card Count"
              type="number"
              fullWidth
              inputProps={{ min: 3, max: 15 }}
              value={aiCount}
              onChange={(e) => setAiCount(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAiModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
            >
              {isGenerating ? 'Generating Deck...' : 'Generate Deck'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manual Card Add Modal */}
      <Dialog open={manualModalOpen} onClose={() => setManualModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Flashcard</DialogTitle>
        <form onSubmit={handleManualAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Topic Tag"
              fullWidth
              placeholder="e.g. Time Complexity"
              value={manualCard.topic}
              onChange={(e) => setManualCard({ ...manualCard, topic: e.target.value })}
            />

            <TextField
              label="Front Side (Question / Term / Formula)"
              multiline
              rows={3}
              fullWidth
              required
              value={manualCard.frontText}
              onChange={(e) => setManualCard({ ...manualCard, frontText: e.target.value })}
            />

            <TextField
              label="Back Side (Answer / Explanation / Derivation)"
              multiline
              rows={4}
              fullWidth
              required
              value={manualCard.backText}
              onChange={(e) => setManualCard({ ...manualCard, backText: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setManualModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Card</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Flashcard"
        message="Are you sure you want to remove this flashcard from your deck?"
        onConfirm={handleDeleteCard}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
