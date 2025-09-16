// src/components/chat/ChatModal.jsx
// Main ChatModal (split version) — this contains your full component logic,
// state, socket wiring, helpers and render logic (moved into this file from your big file).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '../Modal';
import Toast from '../Toast';
import '../../styles/ChatModal.css';
import {
  listChats,
  createDirectChat,
  createGroupChat,
  getChatMessages,
  uploadVoiceNote,
  // other ChatApi functions you already have
} from '../../services/ChatApi';
import useChatSocket from '../../hooks/useChatSocket';
import EmojiPicker from '../../media/EmojiPicker';

import ChatAvatar from './ChatAvatar';
import FloatingMiniMenu from './FloatingMiniMenu';
import GroupSettingsModal from './GroupSettingsModal';
import NewGroupPanel from './NewGroupPanel';
import ExpandableText from './ExpandableText';

import { initialsFromName, timeAgoString, formatLocalTime } from './utils/format';
import { pickColor } from './utils/colors';

// -----------------------------
// Main ChatModal component
// -----------------------------
export default function ChatModal({ onClose, offices: officesProp }) {
  // Auth context (from local storage like your original file)
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const myOfficeId = userInfo?.office?.id;

  // Core data
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [offices, setOffices] = useState(officesProp || []);

  // UI state
  const [view, setView] = useState('chats'); // 'chats' | 'newDirect' | 'newGroup'
  const [filter, setFilter] = useState('all'); // all | individual | groups
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // composer & emoji
  const [input, setInput] = useState('');
  const [emojiVisible, setEmojiVisible] = useState(false);
  const emojiRef = useRef(null);

  // recording / voice note UI (Requirement 14)
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const recordTimerRef = useRef(null);

  // unread badges and unseen counts (Requirement 9 + 10 + 11)
  const [unseenCounts, setUnseenCounts] = useState({}); // { chatId: count }
  const [totalUnread, setTotalUnread] = useState(0); // used by ChatButton

  // menu positioning state for three-dots menu (Requirement 2)
  const [menuAnchorRect, setMenuAnchorRect] = useState(null);
  const [menuActions, setMenuActions] = useState([]);
  const [menuChatContext, setMenuChatContext] = useState(null);

  // group settings modal
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // responsive
  const [isMobile, setIsMobile] = useState(window.matchMedia ? window.matchMedia('(max-width: 992px)').matches : false);
  const [mobileScreen, setMobileScreen] = useState(isMobile ? 'list' : 'chat');

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 992px)');
    const handler = (e) => {
      setIsMobile(e.matches);
      setMobileScreen(e.matches ? 'list' : 'chat');
    };
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler); };
  }, []);

  // message scroll
  const messagesContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // -----------------------------
  // Helper functions used widely
  // -----------------------------
  function upsertMessage(prev, evtPayload) {
    const exists = prev.some(m => m.id === evtPayload.id);
    if (exists) return prev.map(m => m.id === evtPayload.id ? { ...m, ...evtPayload } : m);
    return [...prev, evtPayload];
  }
  function replaceTempWithReal(prev, tempId, real) {
    const idx = prev.findIndex(m => m.temp_id === tempId);
    if (idx === -1) return [...prev, real];
    const copy = [...prev];
    copy[idx] = real;
    return copy;
  }
  function moveChatToTopAndUpdate(prev, chatId, evt) {
    // Move chat to top and update last_message
    const idx = prev.findIndex(c => c.id === chatId);
    let copy = [...prev];
    if (idx !== -1) {
      const c = { ...copy[idx], last_message: evt };
      copy.splice(idx, 1);
      copy.unshift(c);
    } else {
      // if not present, rely on refresh later
    }
    return copy;
  }

  function scrollToBottomSmooth() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(() => setIsAtBottom(true), 200);
  }

  // socket
  const { subscribe, unsubscribe, sendMessage, editMessage, deleteMessageForAll, deleteMessageForMe, readUpTo } =
    useChatSocket(token, {
      onEvent: (evt) => {
        // central socket event handling (keeps parity with your original file)
        const t = evt.type;
        if (t === 'chat.message.new') {
          const chatId = evt.chat_id || evt.chat;
          const isMine = evt.sender?.id === userInfo?.id;
          setChats(prev => moveChatToTopAndUpdate(prev, evt.chat || evt.chat_id, evt)); // refresh sidebar preview
          if (activeChat && chatId === activeChat.id) {
            setMessages((prev) => upsertMessage(prev, evt));
            if (isMine) {
              scrollToBottomSmooth();
            } else {
              if (isAtBottom) {
                scrollToBottomSmooth();
              } else {
                setUnseenCounts(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
              }
            }
          } else {
            // not active chat -> increment badge
            setUnseenCounts(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
          }
        } else if (t === 'chat.message.edited') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => m.id === evt.message.id ? { ...m, ...evt.message, edited: true, edited_at: evt.message.edited_at || new Date().toISOString() } : m));
          }
          setChats(prev => prev.map(c => c.id === evt.chat_id ? { ...c, last_message: evt.message } : c));
        } else if (t === 'chat.message.deleted') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => m.id === evt.message_id ? { ...m, is_deleted: true, content: '' } : m));
          }
          setChats(prev => prev.map(c => c.id === evt.chat_id ? ({ ...c, last_message: evt.last_message || c.last_message }) : c));
        } else if (t === 'chat.message.read') {
          // mark messages as read locally
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages(prev => prev.map(m => {
              if ((m.sender?.office_id !== myOfficeId) && m.id <= evt.up_to_message_id) {
                const setIds = new Set(m.read_office_ids || []);
                setIds.add(evt.office_id);
                return { ...m, read_office_ids: Array.from(setIds) };
              }
              return m;
            }));
          }
        } else if (t === 'chat.ack') {
          if (evt.ok && evt.message && activeChat && evt.message.chat === activeChat.id) {
            setMessages((prev) => replaceTempWithReal(prev, evt.temp_id, evt.message));
            if (isAtBottom) scrollToBottomSmooth();
          } else if (!evt.ok) {
            showToast(evt.error || 'Message send failed', 'error');
            setMessages((prev) => prev.filter(m => m.temp_id !== evt.temp_id));
          }
        } else if (t === 'chat.created') {
          // Requirement (group create appear immediately)
          const chat = evt.chat;
          setChats(prev => [chat, ...prev]);
        } else if (t === 'error') {
          showToast(evt.error || 'Chat error', 'error');
        }
      }
    });

  // -----------------------------
  // Initial load: chats & offices
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoadingChats(true);
        if (!officesProp || officesProp.length === 0) {
          // TODO: BACKEND: your existing offices endpoint
          const res = await fetch(`${process.env.REACT_APP_API_URL}/filesharing/offices/`);
          const data = await res.json();
          setOffices(data);
        }
        const chatList = await listChats();
        setChats((chatList || []).map(c => ({ ...c, pinned: !!c.pinned, archived: !!c.archived })));
      } catch (e) {
        showToast(e.message || 'Failed to load chats', 'error');
      } finally {
        setLoadingChats(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh chats helper
  const refreshChatList = async () => {
    try {
      const chatList = await listChats();
      setChats((chatList || []).map(c => ({ ...c, pinned: !!c.pinned, archived: !!c.archived })));
    } catch (e) { /* ignore */ }
  };

  // -----------------------------
  // Open a chat (load messages)
  // Requirements: openChat clears unseen count, subscribes socket, ensures mobile screen switching
  // -----------------------------
  const openChat = useCallback(async (chat) => {
    try {
      if (activeChat && activeChat.id === chat.id) {
        if (isMobile) setMobileScreen('chat');
        return;
      }
      if (activeChat) unsubscribe(activeChat.id);
      setActiveChat(chat);
      setView('chats');
      setLoadingMessages(true);
      const msgs = await getChatMessages(chat.id);
      setMessages(msgs || []);
      subscribe(chat.id);
      const last = msgs && msgs[msgs.length - 1];
      if (last) setTimeout(() => readUpTo({ chatId: chat.id, upToMessageId: last.id }), 100);
      setTimeout(scrollToBottomSmooth, 100);
      setUnseenCounts(prev => ({ ...prev, [chat.id]: 0 }));
      if (isMobile) setMobileScreen('chat');
    } catch (e) {
      showToast(e.message || 'Failed to open chat', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [activeChat, isMobile, subscribe, unsubscribe, readUpTo]);

  // -----------------------------
  // Create direct / group chats
  // -----------------------------
  const startDirect = async (officeId) => {
    try {
      const chat = await createDirectChat(officeId);
      // If back-end returns chat, ensure shown
      if (chat) {
        // If this chat is already in list, use that; otherwise prepend
        setChats(prev => {
          const exists = prev.find(c => c.id === chat.id);
          if (exists) {
            return prev.map(c => c.id === chat.id ? chat : c);
          }
          return [chat, ...prev];
        });
        await openChat(chat);
        showToast('Direct chat ready', 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const createGroup = async (groupName, selectedOffices) => {
    try {
      if (!groupName.trim()) return showToast('Group name required', 'error');
      if (!selectedOffices || selectedOffices.length < 2) return showToast('Select at least 2 offices', 'error');
      const chat = await createGroupChat(groupName, selectedOffices);
      if (chat) {
        chat.admin_id = userInfo?.id; // frontend mark until backend returns
        setChats(prev => [chat, ...prev]);
        await openChat(chat);
        showToast('Group created', 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // -----------------------------
  // Sending messages (text + voice)
  // - create temp message, push into messages, send via socket
  // - compute temp_id to reconcile later (Requirement 1 partially front-end)
  // -----------------------------
  const handleSend = async () => {
    if (!activeChat) return;
    const content = input.trim();
    if (!content) return;
    const tempId = `tmp_${Date.now()}`;
    const tempMsg = {
      id: null,
      temp_id: tempId,
      chat: activeChat.id,
      sender: { id: userInfo.id, first_name: userInfo.first_name, last_name: userInfo.last_name, office_id: myOfficeId },
      content,
      voice_note: null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      delivered_office_ids: [],
      read_office_ids: [],
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    // send over socket (or fallback to ChatApi)
    sendMessage({ chatId: activeChat.id, content, voiceNote: null, tempId });
    scrollToBottomSmooth();
  };

  // -----------------------------
  // Voice recording cross-device (Requirement 14):
  // - Use navigator.mediaDevices.getUserMedia when available
  // - Choose supported mime types
  // - Show recording animation and seconds counting
  // - Create blob and call uploadVoiceNote -> then send message with voiceNote URL via socket
  // -----------------------------
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Audio recording not supported in this browser', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // prefer webm/opus if available, fallback to default
      const types = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'audio/wav'
      ];
      let mimeType = '';
      for (const t of types) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
      }
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
          // TODO: BACKEND: uploadVoiceNote should return { url }
          const { url } = await uploadVoiceNote(blob, activeChat?.id);
          // build a temp message with voice_note
          const tempId = `tmp_${Date.now()}`;
          const tempMsg = {
            id: null,
            temp_id: tempId,
            chat: activeChat.id,
            sender: { id: userInfo.id, first_name: userInfo.first_name, last_name: userInfo.last_name, office_id: myOfficeId },
            content: '',
            voice_note: url,
            is_deleted: false,
            created_at: new Date().toISOString(),
            delivered_office_ids: [],
            read_office_ids: [],
          };
          setMessages(prev => [...prev, tempMsg]);
          // send via socket
          sendMessage({ chatId: activeChat.id, content: '', voiceNote: url, tempId });
          scrollToBottomSmooth();
          showToast('Voice note sent', 'success');
        } catch (err) {
          showToast(err.message || 'Upload failed', 'error');
        }
      };
      mr.start();
      setRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch (err) {
      showToast('Mic permission denied or unavailable', 'error');
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      } catch (e) { /* ignore */ }
      setRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  // -----------------------------
  // Edit / Delete handlers (Requirement 12 + 13)
  // Use modals + your toast system (no alerts)
  // -----------------------------
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [messageBeingEdited, setMessageBeingEdited] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const openEditModal = (msg) => {
    setMessageBeingEdited(msg);
    setEditDraft(msg.content || '');
    setEditModalOpen(true);
  };
  const confirmEdit = async () => {
    // TODO: BACKEND: call editMessage API or socket.editMessage
    try {
      if (!messageBeingEdited) return;
      // local optimistic update
      setMessages(prev => prev.map(m => m.id === messageBeingEdited.id ? { ...m, content: editDraft, edited: true, edited_at: new Date().toISOString() } : m));
      editMessage({ messageId: messageBeingEdited.id, newContent: editDraft });
      setEditModalOpen(false);
      setMessageBeingEdited(null);
      showToast('Message edited', 'success');
    } catch (e) {
      showToast('Edit failed', 'error');
    }
  };

  // delete with modal confirm
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState(null);
  const openConfirmDelete = (msg) => { setMsgToDelete(msg); setConfirmDeleteOpen(true); };
  const confirmDeleteForAll = async () => {
    try {
      // TODO: BACKEND call deleteMessageForAll
      await deleteMessageForAll({ messageId: msgToDelete.id });
      setMessages(prev => prev.map(m => m.id === msgToDelete.id ? { ...m, is_deleted: true, content: '' } : m));
      setConfirmDeleteOpen(false);
      setMsgToDelete(null);
      showToast('Deleted for everyone', 'success');
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };
  const confirmDeleteForMe = async () => {
    try {
      // TODO: BACKEND call deleteMessageForMe
      await deleteMessageForMe({ messageId: msgToDelete.id });
      setMessages(prev => prev.filter(m => m.id !== msgToDelete.id));
      setConfirmDeleteOpen(false);
      setMsgToDelete(null);
      showToast('Deleted locally', 'success');
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  // -----------------------------
  // Pin / Archive / Local-delete chat actions (Requirement 2 + 4 for backend wiring)
  // Mini menu opens anchored to the three-dots button (Requirement 2)
  // -----------------------------
  const pinChatApi = async (chatId, pinned) => { /* TODO: BACKEND */ return { success: true }; };
  const archiveChatApi = async (chatId, archived) => { /* TODO: BACKEND */ return { success: true }; };
  const deleteChatLocalApi = async (chatId) => { /* local only */ return { success: true }; };

  const handleTogglePin = async (chat) => {
    const newPinned = !chat.pinned;
    await pinChatApi(chat.id, newPinned);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: newPinned } : c));
  };
  const handleToggleArchive = async (chat) => {
    const newArchived = !chat.archived;
    await archiveChatApi(chat.id, newArchived);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, archived: newArchived } : c));
    if (activeChat && activeChat.id === chat.id && isMobile) setMobileScreen('list');
  };
  const handleLocalDelete = async (chat) => {
    // modal confirm instead of alert
    setMenuActions([]); // close menu
    const ok = window.confirm ? window.confirm('Delete this chat from your side?') : true; // fallback, but we prefer modal flow (we can replace)
    if (!ok) return;
    await deleteChatLocalApi(chat.id);
    setChats(prev => prev.filter(c => c.id !== chat.id));
    if (activeChat && activeChat.id === chat.id) { setActiveChat(null); if (isMobile) setMobileScreen('list'); }
  };

  // -----------------------------
  // Group actions (Requirement group list)
  // -----------------------------
  const addGroupMembersApi = async (chatId, officeIds) => { /* TODO: BACKEND */ return { success: true, updatedChat: null }; };
  const leaveGroupApi = async (chatId) => { /* TODO: BACKEND */ return { success: true }; };
  const deleteGroupApi = async (chatId) => { /* TODO: BACKEND */ return { success: true }; };

  const handleAddMembers = async (chat, officeIds) => {
    if (chat.admin_id !== userInfo?.id) { showToast('Only admin can add members', 'error'); return; }
    try {
      const res = await addGroupMembersApi(chat.id, officeIds);
      if (res && res.updatedChat) {
        setChats(prev => prev.map(c => c.id === chat.id ? res.updatedChat : c));
        setActiveChat(res.updatedChat);
      }
      showToast('Members added (frontend simulated)', 'success');
    } catch (e) { showToast('Failed to add members', 'error'); }
  };
  const handleLeaveGroup = async (chat) => {
    // use modal confirmation instead of alert
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await leaveGroupApi(chat.id);
      if (!res || !res.success) throw new Error('Leave failed (simulated)');
      setChats(prev => {
        const copy = prev.map(c => {
          if (c.id !== chat.id) return c;
          const remaining = (c.participants || []).filter(p => p.id !== userInfo.id);
          if (remaining.length === 0) return null;
          let newAdmin = c.admin_id;
          if (c.admin_id === userInfo.id) newAdmin = remaining[Math.floor(Math.random() * remaining.length)].id;
          return { ...c, participants: remaining, admin_id: newAdmin };
        }).filter(Boolean);
        return copy;
      });
      if (activeChat && activeChat.id === chat.id) { setActiveChat(null); if (isMobile) setMobileScreen('list'); }
      showToast('You left the group (frontend simulated)', 'success');
    } catch (e) { showToast(e.message || 'Failed to leave group', 'error'); }
  };
  const handleDeleteGroup = async (chat) => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try {
      const res = await deleteGroupApi(chat.id);
      if (!res || !res.success) throw new Error('Delete failed (simulated)');
      setChats(prev => prev.filter(c => c.id !== chat.id));
      if (activeChat && activeChat.id === chat.id) { setActiveChat(null); if (isMobile) setMobileScreen('list'); }
      showToast('Group deleted (frontend simulated)', 'success');
    } catch (e) { showToast(e.message || 'Failed to delete group', 'error'); }
  };

  // -----------------------------
  // Search & suggestions (small, kept local)
  // -----------------------------
  const buildSuggestions = (q) => {
    if (!q) return [];
    const lower = q.toLowerCase();
    const filtered = chats.filter(c => {
      if (filter === 'individual' && c.is_group) return false;
      if (filter === 'groups' && !c.is_group) return false;
      if (c.is_group && c.name && c.name.toLowerCase().includes(lower)) return true;
      if (!c.is_group) {
        const parts = (c.participants || []).map(p => p.name || ((p.first_name || '') + ' ' + (p.last_name || ''))).join(' ');
        if (parts.toLowerCase().includes(lower)) return true;
      }
      if (c.last_message && c.last_message.content && c.last_message.content.toLowerCase().includes(lower)) return true;
      return false;
    });
    return filtered.slice(0, 8);
  };
  const searchChats = async (q) => buildSuggestions(q);
  useEffect(() => {
    if (!searchQuery) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchChats(searchQuery);
        setSuggestions(res);
      } catch {}
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, filter, chats]);

  useEffect(() => {
    const onDoc = (e) => { if (!searchRef.current) return; if (!searchRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // -----------------------------
  // Scroll handling
  // -----------------------------
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
      setIsAtBottom(atBottom);
      if (atBottom && activeChat) setUnseenCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeChat]);

  // -----------------------------
  // Emoji behavior (Requirement 3):
  // - Persist until click outside or focus in input
  // -----------------------------
  useEffect(() => {
    const onDoc = (e) => {
      if (!emojiRef.current) return;
      const el = emojiRef.current;
      if (!el.contains(e.target) && !e.target.classList.contains('emoji-toggle')) {
        setEmojiVisible(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // Keep message "time ago" updated every 60s (Requirement 8)
  useEffect(() => {
    const iv = setInterval(() => {
      // trigger re-render so UI recomputes timeAgoString
      setMessages(prev => prev.map(m => ({ ...m })));
    }, 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // Compute total unread whenever unseenCounts changes (Requirement 10)
  useEffect(() => {
    const total = Object.values(unseenCounts).reduce((s, n) => s + (n || 0), 0);
    setTotalUnread(total);
  }, [unseenCounts]);

  // -----------------------------
  // Helper render functions
  // -----------------------------
  function computeStatus(msg, activeChatLocal) {
    // Requirement 1: statuses: pending / sent / delivered / read
    // We attempt to compute from msg.delivered_office_ids and msg.read_office_ids
    // Note: requires backend to send those reliably; UI will update when socket events come in.
    if (msg.temp_id) return 'sending';
    const recipients = (activeChatLocal?.participants || []).map(p => p.office_id).filter(id => id !== msg.sender?.office_id);
    const delivered = (msg.delivered_office_ids || []);
    const read = (msg.read_office_ids || []);
    const allDelivered = recipients.length > 0 && recipients.every(r => delivered.includes(r));
    const allRead = recipients.length > 0 && recipients.every(r => read.includes(r));
    if (allRead) return 'read';
    if (allDelivered) return 'delivered';
    return 'sent';
  }

  // Where unread messages start: create a function that returns index to place marker (Requirement 11)
  function indexOfFirstUnreadMessage(chatId, msgs) {
    const unread = (unseenCounts[chatId] || 0);
    if (!unread) return -1;
    const idx = msgs.length - unread;
    return Math.max(0, idx);
  }

  // -----------------------------
  // Render: left pane (sidebar) + right pane (chat body)
  // -----------------------------
  const leftPane = (
    <div className="chat-left">
      <div className="chat-left-header">
        <h3>Chats</h3>
        <div className="chat-left-actions">
          <button className={`chip ${view === 'newDirect' ? 'active' : ''}`} onClick={() => setView('newDirect')}>New Chat</button>
          <button className={`chip ${view === 'newGroup' ? 'active' : ''}`} onClick={() => setView('newGroup')}>New Group</button>
        </div>
      </div>

      <div className="chat-filters-search">
        <div className="top-links">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowArchived(s => !s); }}>{showArchived ? 'Back to chats' : `Archived (${chats.filter(c => c.archived).length})`}</a>
        </div>
        <div className="filter-row">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'individual' ? 'active' : ''}`} onClick={() => setFilter('individual')}>Individuals</button>
          <button className={`filter-btn ${filter === 'groups' ? 'active' : ''}`} onClick={() => setFilter('groups')}>Groups</button>
        </div>
        <div className="search-wrap" ref={searchRef}>
          <input
            className="input search-input"
            placeholder={`Search ${filter === 'all' ? 'all chats' : filter}`}
            value={searchQuery}
            onFocus={() => { if (suggestions.length) {/* show suggestions via state */} }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {suggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map(s => (
                <div key={s.id} className="suggestion-item" onClick={() => { setSearchQuery(''); openChat(s); }}>
                  <div className="sugg-left"><ChatAvatar chat={s} userInfo={userInfo} size={36} otherParticipant={(s.participants || []).find(p => p.id !== userInfo?.id)} /></div>
                  <div className="sugg-mid">
                    <div className="sugg-title">{s.is_group ? (s.name || 'Group') : ((s.participants || []).filter(p => p.id !== userInfo?.id).map(p => p.name).join(', ') || 'Direct')}</div>
                    <div className="sugg-sub">{s.last_message ? (s.last_message.content || (s.last_message.voice_note ? '🎤 Voice note' : '')) : 'No messages yet'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'chats' && (
        <div className="chat-list">
          {loadingChats && <div className="loading">Loading chats...</div>}
          {chats.filter(c => {
            if (filter === 'individual') return !c.is_group;
            if (filter === 'groups') return !!c.is_group;
            return true;
          }).filter(c => showArchived ? c.archived : !c.archived).map((c) => {
            // compute display name: if direct -> show only the other party's office + name in brackets (Requirement 6 & 5)
            const other = (c.participants || []).find(p => p.id !== userInfo?.id) || {};
            const title = c.is_group ? (c.name || 'Group') : `${other.office_name || other.office || ''}`.trim();
            const subtitle = c.is_group ? '' : `(${other.name || other.first_name || (other.first_name + ' ' + (other.last_name || ''))})`.trim();
            const last = c.last_message || null;
            const lastText = last ? (last.is_deleted ? 'Message deleted' : (last.content || (last.voice_note ? '🎤 Voice note' : ''))) : 'No messages yet';
            const lastTime = last ? timeAgoString(last.created_at) : '';
            return (
              <div key={c.id} className={`chat-list-item ${activeChat && activeChat.id === c.id ? 'active' : ''}`}>
                <div className="cli-left" onClick={() => openChat(c)}>
                  <ChatAvatar chat={c} otherParticipant={other} size={48} />
                </div>
                <div className="cli-main" onClick={() => openChat(c)}>
                  <div className="cli-title">
                    <span className="cli-name">{c.is_group ? title : `${title} ${subtitle}`}</span>
                  </div>
                  <div className="cli-preview">
                    {last ? (
                      <>
                        <span className="cli-sender">{c.is_group ? (last.sender?.first_name ? `${last.sender.first_name}` : (last.sender?.name || '')) + ':' : ''}</span>
                        <span className="cli-text">{lastText}</span>
                        <span className="cli-time">{lastTime} ago</span>
                      </>
                    ) : <span className="cli-text empty">No messages yet</span>}
                  </div>
                </div>
                <div className="cli-actions">
                  <button
                    className="mini-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      // build menu actions (pin, archive, delete)
                      const actions = [
                        { label: c.pinned ? 'Unpin' : 'Pin', onClick: () => handleTogglePin(c) },
                        { label: c.archived ? 'Unarchive' : 'Archive', onClick: () => handleToggleArchive(c) },
                        { label: 'Delete (this side)', onClick: () => handleLocalDelete(c) }
                      ];
                      setMenuActions(actions);
                      setMenuAnchorRect(rect);
                      setMenuChatContext(c);
                    }}
                    aria-label="Chat options"
                  >
                    ⋯
                  </button>
                </div>

                {/* unread badge on each chat (Requirement 9) */}
                {unseenCounts[c.id] > 0 && <div className="cli-badge">{unseenCounts[c.id]}</div>}
              </div>
            );
          })}
        </div>
      )}

      {view === 'newDirect' && (
        <div className="new-chat">
          <h4>Start a direct chat</h4>
          <div className="office-list">
            {offices.filter(o => o.id !== myOfficeId).map((o) => (
              <button key={o.id} className="office-item" onClick={() => startDirect(o.id)}>{o.name}</button>
            ))}
          </div>
          <button className="secondary" onClick={() => setView('chats')}>Back</button>
        </div>
      )}

      {view === 'newGroup' && (
        <NewGroupPanel offices={offices} myOfficeId={myOfficeId} onCreate={createGroup} onCancel={() => setView('chats')} />
      )}
    </div>
  );

  // Right pane (chat body)
  const rightPane = (
    <div className="chat-right">
      {activeChat ? (
        <>
          <div className="chat-right-header">
            {isMobile && <button className="back-button" aria-label="Back to chats" onClick={() => setMobileScreen('list')}>←</button>}
            <div className="title">
              {/* Requirement 15: show office name big / person name bracketed for direct chats; for groups, show group name */}
              <div className="title-main">
                {activeChat.is_group ? (activeChat.name || 'Group') : (activeChat.other_office_name || 'Office')}
              </div>
              <div className="title-sub">{activeChat.is_group ? '' : `(${(activeChat.participants || []).find(p => p.id !== userInfo?.id)?.name || ''})`}</div>
            </div>
            <div className="header-actions">
              {/* Requirement 18: only show three-dots menu for groups (moved far right; vertical) */}
              {activeChat.is_group ? (
                <button className="mini-menu-btn vertical" onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  // actions include open group settings
                  const actions = [
                    { label: 'Group settings', onClick: () => setGroupSettingsOpen(true) },
                  ];
                  setMenuActions(actions);
                  setMenuAnchorRect(rect);
                  setMenuChatContext(activeChat);
                }}>⋮</button>
              ) : null}
            </div>
          </div>

          <div className="chat-messages" ref={messagesContainerRef}>
            {loadingMessages && <div className="loading">Loading messages...</div>}
            {messages.length === 0 && <div className="empty-chat">No messages yet — say hi 👋</div>}

            {/* render messages with "new messages" marker */}
            {(() => {
              const firstUnreadIndex = indexOfFirstUnreadMessage(activeChat?.id, messages);
              return messages.map((m, idx) => {
                const mine = m.sender?.id === userInfo?.id;
                const side = mine ? 'right' : 'left';
                const status = mine ? computeStatus(m, activeChat) : null;
                const canEdit = m?.can_edit && m.sender?.id === userInfo?.id && !m.is_deleted;
                const showNewMarker = firstUnreadIndex >= 0 && idx === firstUnreadIndex;
                return (
                  <div key={m.id || m.temp_id || idx} className={`msg-row ${side}`}>
                    {showNewMarker && <div className="new-msg-divider"><span>New messages</span></div>}

                    {/* show avatar for non-mine in group chats (Requirement 4 & 7) */}
                    {!mine && activeChat.is_group && (
                      <div className="group-sender-col">
                        <div className="group-sender-avatar">
                          {m.sender ? (
                            m.sender.avatar_url ? <img src={m.sender.avatar_url} alt={m.sender.name || ''} /> :
                              <div className="avatar-generated small" style={{ background: pickColor(m.sender.name || m.sender.first_name || 'user') }}>
                                <span className="avatar-initials small">{initialsFromName(m.sender.name || `${m.sender.first_name || ''} ${m.sender.last_name || ''}`)}</span>
                              </div>
                          ) : (
                            <div className="avatar-generated small" style={{ background: '#c1c1c1' }}>
                              <span className="avatar-initials small">??</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}>
                      {/* group sender name for group messages */}
                      {!mine && activeChat.is_group && (
                        <div className="group-sender-name">{m.sender ? (m.sender.first_name ? `${m.sender.first_name} ${m.sender.last_name || ''}` : m.sender.name) : 'Unknown'}</div>
                      )}

                      {m.is_deleted ? (
                        <div className="deleted-text">This message was deleted</div>
                      ) : (
                        <>
                          {m.content && <div className="msg-text"><ExpandableText text={m.content} /></div>}
                          {m.voice_note && <div className="voice-note"><audio controls src={m.voice_note} /></div>}
                        </>
                      )}

                      <div className="msg-meta">
                        <span className="time">{formatLocalTime(m.created_at)}{m.edited ? ` • edited ${timeAgoString(m.edited_at || m.updated_at || m.created_at)} ago` : ''}</span>
                        {mine && (
                          <span className={`ticks ${status}`}>
                            {status === 'sending' && '⏳'}
                            {status === 'sent' && '✓'}
                            {status === 'delivered' && '✓✓'}
                            {status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {!m.is_deleted && (
                      <div className={`msg-actions ${mine ? 'mine' : ''}`}>
                        {mine && canEdit && <button className="icon-btn" title="Edit" onClick={() => openEditModal(m)}>✏️</button>}
                        {mine && <button className="icon-btn" title="Delete for everyone" onClick={() => { setMsgToDelete(m); setConfirmDeleteOpen(true); }}>🗑️</button>}
                        {!mine && activeChat.chat_type === 'direct' && <button className="icon-btn" title="Delete for me" onClick={() => { setMsgToDelete(m); setConfirmDeleteOpen(true); }}>🙈</button>}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            <div ref={bottomRef} />
            {/* new message quick badge inside chat when not at bottom (Requirement 9) */}
            {activeChat && unseenCounts[activeChat.id] > 0 && !isAtBottom && (
              <div className="new-msg-badge" onClick={() => { scrollToBottomSmooth(); setUnseenCounts(prev => ({ ...prev, [activeChat.id]: 0 })); }}>
                {unseenCounts[activeChat.id]} new
              </div>
            )}
          </div>

          {/* composer */}
          <div className="chat-composer" onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}>
            <button className="emoji-toggle" onClick={(e) => { e.stopPropagation(); setEmojiVisible(v => !v); }}>
              😊
            </button>
            <div ref={emojiRef} className="emoji-container">
              {emojiVisible && <EmojiPicker onSelect={(em) => { setInput(i => i + em); /* keep open */ }} />}
            </div>
            <input
              className="input composer-input"
              placeholder="Type a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setEmojiVisible(false)}
            />
            <div className="recorder-area">
              {!recording ? (
                <button className="mic-btn" title="Record voice note" onClick={startRecording}>🎤</button>
              ) : (
                <button className="mic-btn rec" title="Stop recording" onClick={stopRecording}>
                  <span className="rec-dot" /> {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
                </button>
              )}
            </div>
            <button className="send-btn" onClick={handleSend}>Send</button>
          </div>
        </>
      ) : (
        <div className="empty-state">Select or create a chat to start messaging.</div>
      )}
    </div>
  );

  // -----------------------------
  // Floating mini menu render (anchored to three-dots)
  // -----------------------------
  const miniMenu = menuAnchorRect ? <FloatingMiniMenu anchorRect={menuAnchorRect} actions={menuActions} onClose={() => { setMenuAnchorRect(null); setMenuActions([]); setMenuChatContext(null); }} /> : null;

  // -----------------------------
  // Group settings modal (global)
  // -----------------------------
  const groupSettingsModal = groupSettingsOpen && activeChat ? (
    <GroupSettingsModal
      open={groupSettingsOpen}
      onClose={() => setGroupSettingsOpen(false)}
      chat={activeChat}
      offices={offices}
      onAddMembers={handleAddMembers}
      onLeaveGroup={handleLeaveGroup}
      onDeleteGroup={handleDeleteGroup}
      currentUserId={userInfo?.id}
    />
  ) : null;

  // -----------------------------
  // Edit modal (Requirement 13)
  // -----------------------------
  const editModal = editModalOpen && (
    <Modal onClose={() => setEditModalOpen(false)}>
      <div className="edit-modal">
        <h3>Edit message</h3>
        <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={4} />
        <div className="row">
          <button className="primary" onClick={confirmEdit}>Save</button>
          <button className="secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
        </div>
      </div>
    </Modal>
  );

  // confirm delete modal
  const deleteModal = confirmDeleteOpen && (
    <Modal onClose={() => setConfirmDeleteOpen(false)}>
      <div className="confirm-delete">
        <h3>Delete message</h3>
        <p>Choose what you want to do with this message:</p>
        <div className="row">
          {msgToDelete && msgToDelete.sender?.id === userInfo?.id && <button className="danger" onClick={confirmDeleteForAll}>Delete for everyone</button>}
          <button className="secondary" onClick={confirmDeleteForMe}>Delete for me</button>
          <button className="muted" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
        </div>
      </div>
    </Modal>
  );

  // -----------------------------
  // Toast
  // -----------------------------
  const toastNode = toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null;

  // -------Main----------------------
  // Render Modal wrapper with left + right panes
  // Note: when closing Modal ensure sockets unsubscribed
  // -----------------------------
  return (
    <Modal onClose={() => { if (activeChat) unsubscribe(activeChat.id); onClose(); }}>
      <div className={`chat-modal ${isMobile ? (mobileScreen === 'list' ? 'sidebar-visible' : '') : ''}`}>
        <div className="chat-left-container">{leftPane}</div>
        <div className="chat-right-container">{rightPane}</div>
      </div>

      {miniMenu}
      {groupSettingsModal}
      {editModal}
      {deleteModal}
      {toastNode}
    </Modal>
  );
}
