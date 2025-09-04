// ChatModal.jsx
// Full React component (single-file) with filters, avatars/placeholders, and
// search-autocomplete prepared for future backend hooking.
//
// NEW FEATURES ADDED
//  - Group header 3-dot menu -> opens GroupSettings modal (add members, leave, delete)
//  - Admin role assigned to group creator (client-side placeholder). Only admin can add members.
//  - If admin leaves, a random member becomes admin; if last leaves, group is deleted.
//  - Chat list items have their own mini-menu (delete local/pin/archive)
//  - Archived chats view link at the top of the left pane.
//  - Unread-in-view badge at bottom of chat when new messages arrive while user is scrolled up.
//  - Emoji picker button in the composer to insert emoji into the message input.
//
// There are clear placeholder functions where you should hook backend APIs later (ADD TODO comments).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import '../styles/Chat.css';
import { listChats, createDirectChat, createGroupChat, getChatMessages, uploadVoiceNote } from '../services/ChatApi';
import useChatSocket from '../hooks/useChatSocket';

// --------------------------------------------------
// Small utility & placeholder backend hooks (replace these with your real API calls)
// --------------------------------------------------
async function addGroupMembersApi(chatId, officeIds) {
  // TODO: call backend endpoint to add members to chat
  // return updated chat object
  return { success: true, updatedChat: null };
}
async function leaveGroupApi(chatId) {
  // TODO: call backend endpoint to remove current user from chat
  return { success: true };
}
async function deleteGroupApi(chatId) {
  // TODO: call backend endpoint to delete chat
  return { success: true };
}
async function pinChatApi(chatId, pinned) {
  // TODO: call backend endpoint to pin/unpin chat for current user
  return { success: true };
}
async function archiveChatApi(chatId, archived) {
  // TODO: call backend endpoint to archive/unarchive chat for current user
  return { success: true };
}
async function deleteChatLocalApi(chatId) {
  // TODO: local-delete a chat for current user (not for others)
  return { success: true };
}

// --------------------------------------------------
// Small UI components
// --------------------------------------------------
function OfficePicker({ offices, selected, onToggle }) {
  return (
    <div className="office-picker">
      {offices.map((o) => (
        <label key={o.id} className="office-pill">
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={() => onToggle(o.id)}
          />
          <span>{o.name}</span>
        </label>
      ))}
    </div>
  );
}

function EmojiPicker({ onSelect }) {
  // a tiny curated set of emoji; replace or expand as you like
  const emojis = ['😀','😁','😂','🤣','😊','😍','🤔','👍','🙏','🔥','🎉','❤️','🤝','🙌','😅','😎','🫡','👏','🤷‍♂️'];
  return (
    <div className="emoji-picker">
      {emojis.map(e => (
        <button key={e} type="button" className="emoji-btn" onClick={() => onSelect(e)}>{e}</button>
      ))}
    </div>
  );
}

function ChatAvatar({ chat, userInfo, size = 40 }) {
  const avatarColors = [ '#6C5CE7','#00B894','#0984E3','#FD79A8','#E17055','#00CEC9','#A29BFE' ];
  function pickColor(seed) {
    if (!seed) return avatarColors[0];
    let sum = 0; for (let i=0;i<seed.length;i++) sum += seed.charCodeAt(i);
    return avatarColors[sum % avatarColors.length];
  }
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  if (chat.is_group) {
    if (chat.avatar_url) return <img className="chat-avatar" src={chat.avatar_url} alt={chat.name || 'Group'} style={{ width: size, height: size }} />;
    const name = chat.name || 'Group';
    return (
      <div className="chat-avatar avatar-generated" style={{ width: size, height: size, background: pickColor(name) }}>
        <svg viewBox="0 0 24 24" width={size*0.55} height={size*0.55} aria-hidden>
          <path fill="#fff" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM18 13c-.29 0-.62.02-.97.06C17.46 14.12 18 15.5 18 17v2h4v-2.5c0-2.33-4.67-3.5-4-3.5z"/>
        </svg>
      </div>
    );
  }
  const other = (chat.participants || []).find(p => p.id !== userInfo?.id) || (chat.participants && chat.participants[0]);
  const displayName = other?.name || ((other?.first_name||'') + ' ' + (other?.last_name||'')) || 'User';
  if (other?.avatar_url) return <img className="chat-avatar" src={other.avatar_url} alt={displayName} style={{ width: size, height: size }} />;
  return (
    <div className="chat-avatar avatar-generated" style={{ width: size, height: size, background: pickColor(displayName) }}>
      <span className="avatar-initials">{getInitials(displayName)}</span>
    </div>
  );
}

// Chat list item with small menu (delete local, pin, archive)
function ChatListItem({ chat, active, onOpen, onLocalDelete, onTogglePin, onToggleArchive, userInfo }) {
  const [showMenu, setShowMenu] = useState(false);
  const pinIcon = chat.pinned ? '📌' : '📍';
  return (
    <div className={`chat-list-item ${active ? 'active' : ''}`}>
      <div className="cli-left" onClick={() => onOpen(chat)}>
        <ChatAvatar chat={chat} userInfo={userInfo} size={48} />
      </div>
      <div className="cli-main" onClick={() => onOpen(chat)}>
        <div className="cli-title">
          <span className="cli-name">{chat.is_group ? (chat.name || 'Group') : ((chat.participants||[]).filter(p => p.id !== userInfo?.id).map(p => p.name).join(', ') || 'Direct chat')}</span>
        </div>
        <div className="cli-preview">
          {chat.last_message ? (
            <>
              <span className="cli-sender">
                {chat.last_message.sender?.first_name ? `${chat.last_message.sender.first_name}` : (chat.last_message.sender?.name || '')}{chat.is_group && ':'}
              </span>
              <span className="cli-text">
                {chat.last_message.is_deleted ? 'Message deleted' : (chat.last_message.content || (chat.last_message.voice_note ? '🎤 Voice note' : ''))}
              </span>
              <span className="cli-time">{chat.last_message.ago}</span>
            </>
          ) : (
            <span className="cli-text empty">No messages yet</span>
          )}
        </div>
      </div>

      <div className="cli-actions">
        <button className="mini-menu-btn" onClick={() => setShowMenu(s => !s)}>⋯</button>
        {showMenu && (
          <div className="mini-menu" onMouseLeave={() => setShowMenu(false)}>
            <button className="mini-item" onClick={() => { setShowMenu(false); onTogglePin(chat); }}>{pinIcon} {chat.pinned ? 'Unpin' : 'Pin'}</button>
            <button className="mini-item" onClick={() => { setShowMenu(false); onToggleArchive(chat); }}>{chat.archived ? '📥 Unarchive' : '🗄️ Archive'}</button>
            <button className="mini-item" onClick={() => { setShowMenu(false); onLocalDelete(chat); }}>🗑️ Delete (this side)</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Group Settings modal
function GroupSettingsModal({ open, onClose, chat, offices, onAddMembers, onLeaveGroup, onDeleteGroup, currentUserId }) {
  const [selected, setSelected] = useState([]);
  useEffect(() => { if (!open) setSelected([]); }, [open]);
  if (!open || !chat) return null;

  const isAdmin = chat.admin_id === currentUserId;
  const members = chat.participants || [];

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <Modal onClose={onClose}>
      <div className="group-settings">
        <h3>Group settings</h3>
        <div className="group-section">
          <strong>Group:</strong> {chat.name || 'Unnamed group'}
        </div>
        <div className="group-section">
          <strong>Members ({members.length}):</strong>
          <div className="members-list">
            {members.map(m => (
              <div className="member-row" key={m.id}>
                <div className="member-left"><img src={m.avatar_url} alt={m.name} onError={(e)=>{e.target.style.display='none'}}/></div>
                <div className="member-mid">{m.name || (m.first_name+' '+m.last_name)}</div>
                <div className="member-right">{chat.admin_id === m.id ? <span className="badge">admin</span> : null}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="group-section">
          <strong>Add members</strong>
          <div className="muted">Only the admin can add members</div>
          <OfficePicker offices={offices} selected={selected} onToggle={toggle} />
          <div className="row">
            <button className="primary" disabled={!isAdmin || selected.length===0} onClick={() => onAddMembers(chat, selected)}>Add</button>
            <button className="secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="group-section danger">
          <button className="secondary" onClick={() => onLeaveGroup(chat)}>Leave Group</button>
          {members.length <= 1 && chat.admin_id === currentUserId && (
            <button className="danger" onClick={() => onDeleteGroup(chat)}>Delete Group</button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// --------------------------------------------------
// Main chat modal
// --------------------------------------------------
export default function ChatModal({ onClose, offices: officesProp }) {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const myOfficeId = userInfo?.office?.id;

  const [toast, setToast] = useState(null);
  const showToast = (message, type='success') => setToast({ message, type });

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [offices, setOffices] = useState(officesProp || []);
  const [view, setView] = useState('chats'); // chats | newDirect | newGroup
  const [groupName, setGroupName] = useState('');
  const [selectedOffices, setSelectedOffices] = useState([]);

  // filters & search
  const [filter, setFilter] = useState('all'); // all | individual | groups
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // composer
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // unread / scroll state
  const messagesContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unseenCounts, setUnseenCounts] = useState({}); // { chatId: count }

  // group settings modal state
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

  // socket
  const { subscribe, unsubscribe, sendMessage, editMessage, deleteMessageForAll, deleteMessageForMe, readUpTo } =
    useChatSocket(token, {
      onEvent: (evt) => {
        const t = evt.type;
        if (t === 'chat.message.new') {
          const chatId = evt.chat_id || evt.chat;
          if (activeChat && chatId === activeChat.id) {
            // insert but only autoscroll if user is at bottom
            setMessages((prev) => upsertMessage(prev, evt));
            if (isAtBottom) {
              scrollToBottomSmooth();
            } else {
              // increment unseen counter for this chat
              setUnseenCounts(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
            }
          }
          // refresh chat preview for lists
          refreshChatList();
        } else if (t === 'chat.message.edited') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => m.id === evt.message.id ? {...m, ...evt.message} : m));
          }
        } else if (t === 'chat.message.deleted') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => m.id === evt.message_id ? {...m, is_deleted: true, content:''} : m));
          }
        } else if (t === 'chat.message.hidden') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.filter(m => m.id !== evt.message_id));
          }
        } else if (t === 'chat.message.read') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => {
              if (m.sender?.office_id !== myOfficeId && m.id <= evt.up_to_message_id) {
                const setIds = new Set(m.read_office_ids || []);
                setIds.add(evt.office_id);
                return {...m, read_office_ids: Array.from(setIds)};
              }
              return m;
            }));
          }
        } else if (t === 'chat.message.delivered.bulk') {
          if (activeChat && evt.chat_id === activeChat.id) {
            setMessages((prev) => prev.map(m => {
              if (m.sender?.office_id !== evt.office_id) {
                const setIds = new Set(m.delivered_office_ids || []);
                setIds.add(evt.office_id);
                return {...m, delivered_office_ids: Array.from(setIds)};
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
        } else if (t === 'error') {
          showToast(evt.error || 'Chat error', 'error');
        }
      }
    });

  function upsertMessage(prev, evtPayload) {
    const exists = prev.some(m => m.id === evtPayload.id);
    if (exists) return prev.map(m => m.id === evtPayload.id ? {...m, ...evtPayload} : m);
    return [...prev, evtPayload];
  }
  function replaceTempWithReal(prev, tempId, real) {
    const idx = prev.findIndex(m => m.temp_id === tempId);
    if (idx === -1) return [...prev, real];
    const copy = [...prev];
    copy[idx] = real;
    return copy;
  }

  const scrollToBottomSmooth = () => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(() => setIsAtBottom(true), 200);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoadingChats(true);
        if (!officesProp || officesProp.length === 0) {
          // fetch offices only if not passed
          const res = await fetch(`${process.env.REACT_APP_API_URL}/filesharing/offices/`);
          const data = await res.json();
          setOffices(data);
        }
        const chatList = await listChats();
        // ensure pinned/archived flags exist to avoid undefined issues
        setChats((chatList || []).map(c => ({ ...c, pinned: c.pinned || false, archived: c.archived || false })));
      } catch (e) {
        showToast(e.message || 'Failed to load chats', 'error');
      } finally {
        setLoadingChats(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const refreshChatList = async () => {
    try {
      const chatList = await listChats();
      setChats((chatList || []).map(c => ({ ...c, pinned: c.pinned || false, archived: c.archived || false })));
    } catch (e) {
      // ignore
    }
  };

  const openChat = async (chat) => {
    try {
      if (activeChat && activeChat.id === chat.id) return;
      if (activeChat) unsubscribe(activeChat.id);
      setActiveChat(chat);
      setView('chats');
      setLoadingMessages(true);
      const msgs = await getChatMessages(chat.id);
      setMessages(msgs || []);
      subscribe(chat.id);
      // after load, mark read up to latest non-mine
      const last = msgs && msgs[msgs.length-1];
      if (last) {
        setTimeout(() => readUpTo({ chatId: chat.id, upToMessageId: last.id }), 100);
      }
      setTimeout(scrollToBottomSmooth, 100);
      // clear unseen counts for this chat
      setUnseenCounts(prev => ({ ...prev, [chat.id]: 0 }));
    } catch (e) {
      showToast(e.message || 'Failed to open chat', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const startDirect = async (officeId) => {
    try {
      const chat = await createDirectChat(officeId);
      await openChat(chat);
      showToast('Direct chat ready', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const createGroup = async () => {
    try {
      if (!groupName.trim()) return showToast('Group name required', 'error');
      if (selectedOffices.length < 2) return showToast('Select at least 2 offices', 'error');
      const chat = await createGroupChat(groupName, selectedOffices);
      // client-side: mark the creator as admin (backend should actually set this)
      if (chat) chat.admin_id = userInfo?.id;
      setGroupName('');
      setSelectedOffices([]);
      await openChat(chat);
      showToast('Group created', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const toggleOffice = (id) => {
    setSelectedOffices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // sending text
  const handleSend = async () => {
    if (!activeChat) return;
    const content = input.trim();
    if (!content) return;
    const tempId = `tmp_${Date.now()}`;
    // optimistic insert
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
    sendMessage({ chatId: activeChat.id, content, voiceNote: null, tempId });
    scrollToBottomSmooth();
  };

  // voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const { url } = await uploadVoiceNote(blob);
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
          sendMessage({ chatId: activeChat.id, content: '', voiceNote: url, tempId });
          scrollToBottomSmooth();
          showToast('Voice note sent', 'success');
        } catch (e) {
          showToast(e.message || 'Voice upload failed', 'error');
        }
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      showToast('Mic permission denied or unavailable', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const handleEdit = async (msg) => {
    const newContent = prompt('Edit message:', msg.content);
    if (newContent === null) return;
    editMessage({ messageId: msg.id, newContent });
  };

  const handleDeleteForAll = (msg) => {
    if (!window.confirm('Delete for everyone?')) return;
    deleteMessageForAll({ messageId: msg.id });
  };

  const handleDeleteForMe = (msg) => {
    if (!window.confirm('Delete for me (local only)?')) return;
    deleteMessageForMe({ messageId: msg.id });
    // also remove locally ASAP
    setMessages(prev => prev.filter(m => m.id !== msg.id));
  };

  // ---- Search/autocomplete logic (frontend-first; ready to hook backend) ----
  // helper: build suggestion items from chats
  const buildSuggestions = (q) => {
    if (!q) return [];
    const lower = q.toLowerCase();
    const filtered = chats.filter(c => {
      if (filter === 'individual' && c.is_group) return false;
      if (filter === 'groups' && !c.is_group) return false;
      // match chat name, participant names, or last message
      if (c.is_group && c.name && c.name.toLowerCase().includes(lower)) return true;
      if (!c.is_group) {
        const parts = (c.participants || []).map(p => p.name || ((p.first_name||'') + ' ' + (p.last_name||''))).join(' ');
        if (parts.toLowerCase().includes(lower)) return true;
      }
      if (c.last_message && c.last_message.content && c.last_message.content.toLowerCase().includes(lower)) return true;
      return false;
    });
    return filtered.slice(0, 8);
  };

  const searchChats = async (q) => {
    // FUTURE: call backend endpoint like `/api/chats/search?q=${encodeURIComponent(q)}&type=${filter}`
    return buildSuggestions(q);
  };

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchChats(searchQuery);
        setSuggestions(res);
        setShowSuggestions(true);
      } catch (e) {
        // ignore search errors for now
      }
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, filter, chats]);

  useEffect(() => {
    const onDoc = (e) => { if (!searchRef.current) return; if (!searchRef.current.contains(e.target)) { setShowSuggestions(false); } };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filteredChats = useMemo(() => {
    let list = [...chats];
    if (filter === 'individual') list = list.filter(c => !c.is_group);
    if (filter === 'groups') list = list.filter(c => c.is_group);
    if (showArchived) list = list.filter(c => c.archived);
    else list = list.filter(c => !c.archived);
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(c => {
        if (c.is_group && c.name && c.name.toLowerCase().includes(lower)) return true;
        const participantsText = (c.participants || []).map(p => (p.name || (p.first_name + ' ' + p.last_name))).join(' ').toLowerCase();
        if (participantsText.includes(lower)) return true;
        if (c.last_message && c.last_message.content && c.last_message.content.toLowerCase().includes(lower)) return true;
        return false;
      });
    }
    // pinned chats first
    list.sort((a,b) => (b.pinned === true) - (a.pinned === true));
    return list;
  }, [chats, filter, searchQuery, showArchived]);

  // ---- Chat options handlers (left-list) ----
  const handleLocalDelete = async (chat) => {
    if (!window.confirm('Delete this chat from your side?')) return;
    await deleteChatLocalApi(chat.id);
    setChats(prev => prev.filter(c => c.id !== chat.id));
    if (activeChat && activeChat.id === chat.id) setActiveChat(null);
  };
  const handleTogglePin = async (chat) => {
    const newPinned = !chat.pinned;
    await pinChatApi(chat.id, newPinned);
    setChats(prev => prev.map(c => c.id === chat.id ? {...c, pinned: newPinned} : c));
  };
  const handleToggleArchive = async (chat) => {
    const newArchived = !chat.archived;
    await archiveChatApi(chat.id, newArchived);
    setChats(prev => prev.map(c => c.id === chat.id ? {...c, archived: newArchived} : c));
  };

  // ---- Group settings actions ----
  const handleOpenGroupSettings = () => setGroupSettingsOpen(true);

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
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await leaveGroupApi(chat.id);
      if (!res || !res.success) throw new Error('Leave failed (simulated)');

      // client-side adjustments: remove current user from participants
      setChats(prev => {
        const copy = prev.map(c => {
          if (c.id !== chat.id) return c;
          const remaining = (c.participants || []).filter(p => p.id !== userInfo.id);
          // if no one left -> remove chat
          if (remaining.length === 0) return null;
          // if admin left, appoint random admin
          let newAdmin = c.admin_id;
          if (c.admin_id === userInfo.id) {
            newAdmin = remaining[Math.floor(Math.random() * remaining.length)].id;
          }
          return { ...c, participants: remaining, admin_id: newAdmin };
        }).filter(Boolean);
        return copy;
      });

      // if the user left the active chat, close it
      if (activeChat && activeChat.id === chat.id) {
        setActiveChat(null);
      }
      showToast('You left the group (frontend simulated)', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to leave group', 'error');
    }
  };

  const handleDeleteGroup = async (chat) => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try {
      const res = await deleteGroupApi(chat.id);
      if (!res || !res.success) throw new Error('Delete failed (simulated)');
      setChats(prev => prev.filter(c => c.id !== chat.id));
      if (activeChat && activeChat.id === chat.id) setActiveChat(null);
      showToast('Group deleted (frontend simulated)', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to delete group', 'error');
    }
  };

  // search suggestion click -> open chat
  const handleSuggestionClick = (s) => { setSearchQuery(''); setShowSuggestions(false); openChat(s); };

  // message list scroll handling
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
      setIsAtBottom(atBottom);
      if (atBottom && activeChat) {
        // clear unseen
        setUnseenCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeChat]);

  // composer emoji select
  const handleEmojiSelect = (e) => {
    setInput(i => i + e);
    setEmojiVisible(false);
  };

  // ---- Render panes ----
  const leftPane = (
    <div className="chat-left">
      <div className="chat-left-header">
        <h3>Chats</h3>
        <div className="chat-left-actions">
          <button className={`chip ${view==='newDirect'?'active':''}`} onClick={() => setView('newDirect')}>New Chat</button>
          <button className={`chip ${view==='newGroup'?'active':''}`} onClick={() => setView('newGroup')}>New Group</button>
        </div>
      </div>

      <div className="chat-filters-search">
        <div className="top-links">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowArchived(s => !s); }}>{showArchived ? 'Back to chats' : `Archived (${chats.filter(c => c.archived).length})`}</a>
        </div>

        <div className="filter-row">
          <button className={`filter-btn ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter==='individual'?'active':''}`} onClick={() => setFilter('individual')}>Individuals</button>
          <button className={`filter-btn ${filter==='groups'?'active':''}`} onClick={() => setFilter('groups')}>Groups</button>
        </div>

        <div className="search-wrap" ref={searchRef}>
          <input
            className="input search-input"
            placeholder={`Search ${filter==='all' ? 'all chats' : filter}`} 
            value={searchQuery}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {showSuggestions && suggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map(s => (
                <div key={s.id} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                  <div className="sugg-left"><ChatAvatar chat={s} userInfo={userInfo} size={36} /></div>
                  <div className="sugg-mid">
                    <div className="sugg-title">{s.is_group ? (s.name || 'Group') : ((s.participants||[]).filter(p=>p.id!==userInfo?.id).map(p=>p.name).join(', ') || 'Direct')}</div>
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
          {filteredChats.map((c) => (
            <ChatListItem key={c.id} chat={c} active={activeChat && activeChat.id === c.id} onOpen={openChat}
              onLocalDelete={handleLocalDelete} onTogglePin={handleTogglePin} onToggleArchive={handleToggleArchive} userInfo={userInfo} />
          ))}
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
        <div className="new-group">
          <h4>Create a group</h4>
          <input className="input" placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
          <OfficePicker
            offices={offices}
            selected={selectedOffices}
            onToggle={toggleOffice}
          />
          <div className="row">
            <button className="primary" onClick={createGroup}>Create</button>
            <button className="secondary" onClick={() => setView('chats')}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  const rightPane = (
    <div className="chat-right">
      {activeChat ? (
        <>
          <div className="chat-right-header">
            <div className="title">
              {activeChat.is_group ? (activeChat.name || 'Group') : 'Direct chat'}
              <div className="subtitle">
                {activeChat.participants.map(p => p.name).join(', ')}
              </div>
            </div>

            <div className="header-actions">
              <button className="mini-menu-btn" onClick={handleOpenGroupSettings}>⋯</button>
            </div>
          </div>

          <div className="chat-messages" ref={messagesContainerRef}>
            {loadingMessages && <div className="loading">Loading messages...</div>}
            {messages.map((m) => {
              const mine = m.sender?.id === userInfo?.id;
              const side = mine ? 'right' : 'left';
              const status = mine ? computeStatus(m, activeChat, userInfo) : null;
              const canEdit = m?.can_edit && m.sender?.id === userInfo?.id && !m.is_deleted;

              return (
                <div key={m.id || m.temp_id} className={`msg-row ${side}`}>
                  {!mine && activeChat.is_group && (
                    <div className="group-sender-col">
                      <div className="group-sender-avatar">
                        {m.sender ? (
                        m.sender.avatar_url ? (
                        <img src={m.sender.avatar_url} alt={m.sender.first_name || m.sender.name} />
                        ) : (
                        <div className="avatar-generated small" style={{ background: '#c1c1c1' }}>
                        <span className="avatar-initials small">
                        {(() => {
                        const firstName = m.sender.first_name || '';
                        const lastName = m.sender.last_name || '';
                        if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
                        if (firstName) return firstName.slice(0, 2).toUpperCase();
                        return '??';
                        })()}
                        </span>
                        </div>
                        )
                        ) : (
                        <div className="avatar-generated small" style={{ background: '#c1c1c1' }}>
                        <span className="avatar-initials small">??</span>
                        </div>
                        )}
                        </div>
                    </div>
                  )}

                  <div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}>
                    {!mine && activeChat.is_group && (
                      <div className="group-sender-name">{m.sender ? (m.sender.first_name ? `${m.sender.first_name} ${m.sender.last_name || ''}` : m.sender.name) : 'Unknown'}</div>
                    )}

                    {m.is_deleted ? (
                      <div className="deleted-text">This message was deleted</div>
                    ) : (
                      <>
                        {m.content && (
                          <div className="msg-text">
                            <ExpandableText text={m.content} />
                          </div>
                        )}
                        {m.voice_note && (
                          <div className="voice-note">
                            <audio controls src={m.voice_note} />
                          </div>
                        )}
                      </>
                    )}

                    <div className="msg-meta">
                      <span className="time">{formatTime(m.created_at)}</span>
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
                      {mine && canEdit && <button className="icon-btn" title="Edit" onClick={() => handleEdit(m)}>✏️</button>}
                      {mine && <button className="icon-btn" title="Delete for everyone" onClick={() => handleDeleteForAll(m)}>🗑️</button>}
                      {!mine && activeChat.chat_type === 'direct' && (
                        <button className="icon-btn" title="Delete for me" onClick={() => handleDeleteForMe(m)}>🙈</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />

            {/* unseen badge */}
            {activeChat && unseenCounts[activeChat.id] > 0 && !isAtBottom && (
              <div className="new-msg-badge" onClick={() => { scrollToBottomSmooth(); setUnseenCounts(prev => ({ ...prev, [activeChat.id]: 0 })); }}>
                {unseenCounts[activeChat.id]} new
              </div>
            )}

          </div>

          <div className="chat-composer">
            <button className="emoji-toggle" onClick={() => setEmojiVisible(v => !v)}>😊</button>
            {emojiVisible && <EmojiPicker onSelect={handleEmojiSelect} />}
            <input
              className="input"
              placeholder="Type a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <button className={`mic-btn ${recording ? 'rec' : ''}`} onClick={recording ? stopRecording : startRecording}>
              {recording ? '■' : '🎤'}
            </button>
            <button className="send-btn" onClick={handleSend}>Send</button>
          </div>
        </>
      ) : (
        <div className="empty-state">Select or create a chat to start messaging.</div>
      )}
    </div>
  );

  return (
    <Modal onClose={() => { if (activeChat) unsubscribe(activeChat.id); onClose(); }}>
      <div className="chat-modal">
        <div className="chat-left-container">{leftPane}</div>
        <div className="chat-right-container">{rightPane}</div>
      </div>

      {groupSettingsOpen && (
        <GroupSettingsModal open={groupSettingsOpen} onClose={() => setGroupSettingsOpen(false)} chat={activeChat} offices={offices}
          onAddMembers={handleAddMembers} onLeaveGroup={handleLeaveGroup} onDeleteGroup={handleDeleteGroup} currentUserId={userInfo?.id} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Modal>
  );
}

function computeStatus(msg, activeChat, userInfo) {
  if (msg.temp_id) return 'sending';
  const recipients = (activeChat?.participants || []).map(p => p.id).filter(id => id !== msg.sender?.office_id);
  const delivered = (msg.delivered_office_ids || []);
  const read = (msg.read_office_ids || []);
  const allDelivered = recipients.length > 0 && recipients.every(r => delivered.includes(r));
  const allRead = recipients.length > 0 && recipients.every(r => read.includes(r));
  if (allRead) return 'read';
  if (allDelivered) return 'delivered';
  return 'sent';
}

function formatTime(iso) {
  try { const d = new Date(iso); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= 300) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : text.slice(0, 300) + '... '}
      <button className="read-more" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Read more'}</button>
    </span>
  );
}

