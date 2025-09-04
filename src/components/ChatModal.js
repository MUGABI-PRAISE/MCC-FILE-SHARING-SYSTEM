// src/components/ChatModal.js
import { useEffect, useMemo, useRef, useState } from 'react';

import Modal from './Modal';
import Toast from './Toast';
import '../styles/Chat.css';
import { listChats, createDirectChat, createGroupChat, getChatMessages, uploadVoiceNote } from '../services/ChatApi';
import useChatSocket from '../hooks/useChatSocket';
import { authFetch } from '../services/FetchAuth';

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

// Add a new component for chat avatars
function ChatAvatar({ chat, size = 40 }) {
  if (chat.is_group) {
    // Group chat placeholder - multiple people icon
    return (
      <div 
        className="chat-avatar group-avatar"
        style={{ width: size, height: size }}
      >
        👥
      </div>
    );
  } else {
    // Sample userInfo object structure
    const userInfo = {
      id: 123,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      office: {
        id: 456,
        name: "New York Office"
      }
    };

// How to store it in localStorage
localStorage.setItem('userInfo', JSON.stringify(userInfo));
    // Individual chat - first letter of the other participant's name
    const otherParticipant = chat.participants?.find(p => p.id !== userInfo?.id);
    const displayName = otherParticipant?.name || 'U';
    const initial = displayName.charAt(0).toUpperCase();
    
    return (
      <div 
        className="chat-avatar individual-avatar"
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }
}

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
  
  // NEW STATE: Filters and search
  const [filter, setFilter] = useState('all'); // all, individual, groups
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // message composer
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const bottomRef = useRef(null);
  const searchRef = useRef(null);

  const { subscribe, unsubscribe, sendMessage, editMessage, deleteMessageForAll, deleteMessageForMe, readUpTo } =
    useChatSocket(token, {
      onEvent: (evt) => {
        const t = evt.type;
        if (t === 'chat.message.new') {
          const { chat_id, id } = evt;
          if (activeChat && chat_id === activeChat.id) {
            setMessages((prev) => upsertMessage(prev, evt));
            scrollToBottomSmooth();
          }
          // refresh chat preview
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
            // no need to fetch; we can mark read for office
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
            // replace temp message with real one
            setMessages((prev) => replaceTempWithReal(prev, evt.temp_id, evt.message));
            scrollToBottomSmooth();
          } else if (!evt.ok) {
            showToast(evt.error || 'Message send failed', 'error');
            // remove temp
            setMessages((prev) => prev.filter(m => m.temp_id !== evt.temp_id));
          }
        } else if (t === 'error') {
          showToast(evt.error || 'Chat error', 'error');
        }
      }
    });

  // NEW: Filter chats based on selected filter
  const filteredChats = useMemo(() => {
    let result = chats;
    
    // Apply type filter
    if (filter === 'individual') {
      result = result.filter(chat => !chat.is_group);
    } else if (filter === 'groups') {
      result = result.filter(chat => chat.is_group);
    }
    
    // Apply search filter if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(chat => {
        if (chat.is_group) {
          // For groups, search in name and participants
          return chat.name?.toLowerCase().includes(query) || 
                 chat.participants?.some(p => p.name.toLowerCase().includes(query));
        } else {
          // For individual chats, search in participant names
          return chat.participants?.some(p => 
            p.id !== userInfo?.id && p.name.toLowerCase().includes(query)
          );
        }
      });
    }
    
    return result;
  }, [chats, filter, searchQuery, userInfo?.id]);

  // NEW: Handle search input changes
  useEffect(() => {
    if (searchQuery) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

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
  };

  const computeStatus = (msg) => {
    if (msg.temp_id) return 'sending';
    const recipients = (activeChat?.participants || []).map(p => p.id).filter(id => id !== msg.sender?.office_id);
    const delivered = (msg.delivered_office_ids || []);
    const read = (msg.read_office_ids || []);
    const allDelivered = recipients.length > 0 && recipients.every(r => delivered.includes(r));
    const allRead = recipients.length > 0 && recipients.every(r => read.includes(r));
    if (allRead) return 'read';
    if (allDelivered) return 'delivered';
    return 'sent';
  };

  const canEditMsg = (msg) => msg?.can_edit && msg.sender?.id === userInfo?.id && !msg.is_deleted;

  const isMine = (msg) => msg.sender?.id === userInfo?.id;

  const longTextCollapsed = (text) => text && text.length > 300 ? (text.slice(0, 300) + '...') : text;

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
        setChats(chatList);
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
      setChats(chatList);
    } catch (e) {
      // ignore
    }
  };

  const openChat = async (chat) => {
    try {
      setActiveChat(chat);
      setView('chats');
      setLoadingMessages(true);
      const msgs = await getChatMessages(chat.id);
      setMessages(msgs);
      subscribe(chat.id);
      // after load, mark read up to latest non-mine
      const last = msgs[msgs.length-1];
      if (last) {
        setTimeout(() => readUpTo({ chatId: chat.id, upToMessageId: last.id }), 100);
      }
      setTimeout(scrollToBottomSmooth, 100);
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

  // NEW: Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // NEW: Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const leftPane = (
    <div className="chat-left">
      <div className="chat-left-header">
        <h3>Chats</h3>
        <div className="chat-left-actions">
          <button className={`chip ${view==='newDirect'?'active':''}`} onClick={() => setView('newDirect')}>New Chat</button>
          <button className={`chip ${view==='newGroup'?'active':''}`} onClick={() => setView('newGroup')}>New Group</button>
        </div>
      </div>

      {/* NEW: Search bar */}
      <div className="chat-search-container">
        <input
          ref={searchRef}
          type="text"
          className="chat-search-input"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button className="chat-search-clear" onClick={clearSearch}>
            ×
          </button>
        )}
      </div>

      {/* NEW: Filter buttons */}
      <div className="chat-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'individual' ? 'active' : ''}`}
          onClick={() => setFilter('individual')}
        >
          Individual
        </button>
        <button 
          className={`filter-btn ${filter === 'groups' ? 'active' : ''}`}
          onClick={() => setFilter('groups')}
        >
          Groups
        </button>
      </div>

      {view === 'chats' && (
        <div className="chat-list">
          {loadingChats && <div className="loading">Loading chats...</div>}
          {filteredChats.length === 0 ? (
            <div className="no-chats-message">
              {searchQuery ? 'No matching chats found' : `No ${filter === 'all' ? '' : filter} chats`}
            </div>
          ) : (
            filteredChats.map((c) => (
              <div
                key={c.id}
                className={`chat-list-item ${activeChat && activeChat.id === c.id ? 'active' : ''}`}
                onClick={() => openChat(c)}
              >
                {/* NEW: Chat avatar */}
                <ChatAvatar chat={c} size={48} />
                
                <div className="cli-content">
                  <div className="cli-title">
                    <span className="cli-name">
                      {c.is_group 
                        ? (c.name || 'Group') 
                        : (c.participants?.find(p => p.id !== userInfo?.id)?.name || 'Unknown')
                      }
                    </span>
                  </div>
                  <div className="cli-preview">
                    {c.last_message ? (
                      <>
                        <span className="cli-sender">
                          {c.last_message.sender.first_name}:
                        </span>
                        <span className="cli-text">
                          {c.last_message.is_deleted ? 'Message deleted' : (c.last_message.content || (c.last_message.voice_note ? '🎤 Voice note' : ''))}
                        </span>
                        <span className="cli-time">{c.last_message.ago}</span>
                      </>
                    ) : (
                      <span className="cli-text empty">No messages yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
            {/* NEW: Chat avatar in header */}
            <ChatAvatar chat={activeChat} size={40} />
            <div className="title">
              {activeChat.is_group ? (activeChat.name || 'Group') : 'Direct chat'}
              <div className="subtitle">
                {activeChat.participants.map(p => p.name).join(', ')}
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {loadingMessages && <div className="loading">Loading messages...</div>}
            {messages.map((m) => {
              const mine = isMine(m);
              const side = mine ? 'right' : 'left';
              const status = mine ? computeStatus(m) : null;
              const canEdit = canEditMsg(m);
              const showReadMore = m.content && m.content.length > 300;
              return (
                <div key={m.id || m.temp_id} className={`msg-row ${side}`}>
                  {/* NEW: Show sender name in group chats */}
                  {activeChat.is_group && !mine && (
                    <div className="msg-sender-name">
                      {m.sender?.first_name} {m.sender?.last_name}
                    </div>
                  )}
                  
                  <div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}>
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

                  {/* actions */}
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
          </div>

          <div className="chat-composer">
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
    <Modal onClose={() => {
      if (activeChat) unsubscribe(activeChat.id);
      onClose();
     }}>
      <div className="chat-modal">
        <div className="chat-left-container">
          {leftPane}
        </div>
        <div className="chat-right-container">
          {rightPane}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Modal>
  );
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= 300) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : text.slice(0, 300) + '... '}
      <button className="read-more" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </span>
  );
}