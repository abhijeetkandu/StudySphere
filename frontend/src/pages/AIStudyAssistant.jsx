import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  MenuItem,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';

export default function AIStudyAssistant() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Context Selection for New Chat
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [contextNotes, setContextNotes] = useState('');

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') navigate('/');
      else {
        setUser(parsedUser);
        loadConversations(parsedUser.id);
        fetch(`${API_BASE_URL}/api/admin/subjects`)
          .then((res) => res.json())
          .then(setSubjects)
          .catch(() => {});
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  const loadConversations = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/conversations/student/${studentId}`);
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch {
      showError('Failed to load conversation history');
    }
  };

  const loadMessages = async (convId) => {
    setActiveConvId(convId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${convId}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch {
      showError('Failed to load chat messages');
    }
  };

  const handleNewChat = async (e) => {
    e?.preventDefault();
    try {
      const subjectObj = subjects.find((s) => s.id == selectedSubject);
      const title = subjectObj
        ? `${subjectObj.name}${contextNotes ? ` - ${contextNotes}` : ''}`
        : contextNotes
        ? `Chat: ${contextNotes}`
        : 'Study Discussion';

      const res = await fetch(`${API_BASE_URL}/api/ai/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          subjectId: selectedSubject || null,
          contextNotes: contextNotes || '',
          title,
        }),
      });

      if (res.ok) {
        const newConv = await res.json();
        loadConversations(user.id);
        setActiveConvId(newConv.id);
        setMessages([]);
        setSelectedSubject('');
        setContextNotes('');
      } else {
        showError('Failed to start new session');
      }
    } catch {
      showError('Network error');
    }
  };

  const handleDeleteChat = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Conversation deleted');
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
        loadConversations(user.id);
      }
    } catch {
      showError('Network error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const userMsg = { role: 'user', content: inputText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const sendText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${activeConvId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sendText }),
      });
      if (res.ok) {
        const aiMsg = await res.json();
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Apologies, I encountered an issue connecting to the AI tutor service.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network failure. Please check your connection and try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!user) return null;

  return (
    <Box>
      <PageHeader
        title="AI Study Assistant & 24/7 Tutor"
        subtitle="Clarify tough concepts, solve step-by-step problems, and generate custom study summaries"
        icon={BrainCircuit}
      />

      {/* Main Chat Shell */}
      <Card
        sx={{
          height: { xs: 'auto', md: 'calc(100vh - 210px)' },
          minHeight: { xs: 520, md: 560 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Left Sidebar: Session History */}
        <Box
          sx={{
            display: { xs: activeConvId ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            height: '100%',
            minHeight: { xs: 200, md: 0 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Plus size={18} />}
              onClick={() => setActiveConvId(null)}
              sx={{
                fontWeight: 700,
                py: 1,
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              }}
            >
              New Chat Session
            </Button>
          </Box>

          <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Typography variant="caption" sx={{ px: 1, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              Past Conversations
            </Typography>

            {conversations.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  No previous sessions.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
                {conversations.map((c) => {
                  const isActive = activeConvId === c.id;
                  return (
                    <Box
                      key={c.id}
                      onClick={() => loadMessages(c.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: isActive ? 'primary.light' : 'transparent',
                        color: isActive ? 'primary.dark' : 'text.primary',
                        border: '1px solid',
                        borderColor: isActive ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.light' : 'action.hover',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 700 : 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          fontSize: '0.88rem',
                        }}
                      >
                        {c.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, p: 0.3 }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Area: Chat Window / New Chat Launcher */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'action.hover',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {!activeConvId ? (
            /* Launcher Screen */
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                p: { xs: 2.5, sm: 4, md: 5 },
                textAlign: 'center',
                overflowY: 'auto',
                minHeight: 0,
                width: '100%',
              }}
            >
              <Box
                sx={{
                  my: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 540,
                  py: 2,
                }}
              >
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    mb: 2,
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <BrainCircuit size={34} />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  StudySphere AI Tutor
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mb: 3.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Ask anything about your syllabus, lecture notes, formula derivations, or coding problems.
                </Typography>

                {/* Start Form */}
                <Card sx={{ p: { xs: 2.5, sm: 3 }, maxWidth: 500, width: '100%', borderRadius: '16px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    Set Study Context (Optional)
                  </Typography>

                  <form onSubmit={handleNewChat} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <TextField
                      select
                      label="Subject Context"
                      fullWidth
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <MenuItem value="">-- General Knowledge / Multidisciplinary --</MenuItem>
                      {subjects.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Specific Chapter / Topic Focus"
                      fullWidth
                      placeholder="e.g. Asymptotic Notations & Big-O"
                      value={contextNotes}
                      onChange={(e) => setContextNotes(e.target.value)}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<Sparkles size={18} />}
                      sx={{
                        fontWeight: 700,
                        py: 1.3,
                        background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      Start AI Session
                    </Button>
                  </form>
                </Card>
              </Box>
            </Box>
          ) : (
            /* Active Chat Stream */
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
              {/* Mobile Back Header */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  p: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Button
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => setActiveConvId(null)}
                  sx={{ fontWeight: 700 }}
                >
                  All Chats
                </Button>
              </Box>

              {/* Message List */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  p: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
                    borderRadius: '10px',
                  },
                }}
              >
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Bot size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Session started! Type your question below.
                    </Typography>
                    <Typography variant="caption">
                      e.g., "Explain Binary Trees with an example", "Give me practice problems for Calculus"
                    </Typography>
                  </Box>
                )}

                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        display: 'flex',
                        gap: '10px',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isUser ? 'primary.main' : 'secondary.main',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {isUser ? user.name?.charAt(0) : <Bot size={18} />}
                      </Avatar>

                      <Box>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            bgcolor: isUser ? 'primary.main' : 'background.paper',
                            color: isUser ? '#ffffff' : 'text.primary',
                            border: isUser ? 'none' : '1px solid',
                            borderColor: 'divider',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            fontSize: '0.92rem',
                            boxShadow: isUser ? '0 4px 14px rgba(99, 102, 241, 0.25)' : 'none',
                          }}
                        >
                          {m.content}
                        </Box>

                        {!isUser && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Tooltip title={copiedIdx === idx ? 'Copied!' : 'Copy response'}>
                              <IconButton size="small" onClick={() => handleCopy(m.content, idx)} sx={{ color: 'text.secondary' }}>
                                {copiedIdx === idx ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                    <Bot size={18} color="#6366f1" />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      StudySphere AI is thinking...
                    </Typography>
                    <CircularProgress size={14} sx={{ ml: 0.5 }} />
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Chat Input Bar */}
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'background.paper',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 2,
                }}
              >
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '10px',
                    width: '100%',
                  }}
                >
                  <TextField
                    placeholder="Ask a question, request an explanation, or paste code... (Enter to send, Shift+Enter for new line)"
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={5}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    disabled={isTyping}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: 'action.hover',
                        py: '8px',
                        px: 1.5,
                        fontSize: '0.92rem',
                        '& textarea': {
                          maxHeight: '120px',
                          overflowY: 'auto !important',
                        },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isTyping || !inputText.trim()}
                    sx={{
                      borderRadius: '16px',
                      px: { xs: 2, sm: 3 },
                      height: 40,
                      fontWeight: 700,
                      minWidth: { xs: 48, sm: 90 },
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    <Send size={18} />
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      Send
                    </Box>
                  </Button>
                </form>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
