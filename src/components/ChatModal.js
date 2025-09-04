// src/components/ChatModal.js
import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import '../styles/Chat.css';
import { 
  listChats, createDirectChat, createGroupChat, getChatMessages, 
  uploadVoiceNote, addMembersToGroup, leaveGroup, deleteGroup, 
  updateChatPreferences, sendMessage, editMessage, deleteMessageForAll,
  deleteMessageForMe, markMessagesAsRead
} from '../services/ChatApi';
import useChatSocket from '../hooks/useChatSocket';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import MessageList from '../chat/MessageList';
import MessageComposer from '../chat/MessageComposer';
import GroupSettingsModal from '../chat/GroupSettingsModal';
import ChatOptionsModal from '../chat/ChatOptionsModal';
import EmojiPicker from '../chat/EmojiPicker';

export default function ChatModal({ onClose, offices: officesProp }) {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const myOfficeId = userInfo?.office?.id;
  const userId = userInfo?.id;

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const [chats, setChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [offices, setOffices] = useState(officesProp || []);
  const [view, setView] = useState('chats'); // chats | newDirect | newGroup | archived
  const [groupName, setGroupName] = useState('');
  const [selectedOffices, setSelectedOffices] = useState([]);
  
  // State for new features
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const { subscribe, unsubscribe, sendMessage, editMessage, deleteMessageForAll, deleteMessageForMe, readUpTo } =
    useChatSocket(token, {
      onEvent: (evt) => {
        const t = evt.type;
        if (t === 'chat.message.new') {
          const { chat_id, id } = evt;
          if (activeChat && chat_id === activeChat.id) {
            setMessages((prev) => upsertMessage(prev, evt));
            
            // If user is at the bottom, scroll to new message
            if (isNearBottom()) {
              setTimeout(scrollToBottomSmooth, 100);
            } else {
              // Otherwise, increment unread count
              setUnreadCount(prev => prev + 1);
            }
          }
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
            if (isNearBottom()) {
              setTimeout(scrollToBottomSmooth, 100);
            }
          } else if (!evt.ok) {
            showToast(evt.error || 'Message send failed', 'error');
            setMessages((prev) => prev.filter(m => m.temp_id !== evt.temp_id));
          }
        } else if (t === 'error') {
          showToast(evt.error || 'Chat error', 'error');
        } else if (t === 'chat.updated') {
          // Handle chat updates like member added, admin changed, etc.
          refreshChatList();
          if (activeChat && activeChat.id === evt.chat_id) {
            setActiveChat(prev => ({...prev, ...evt.chat}));
          }
        } else if (t === 'chat.deleted') {
          if (activeChat && activeChat.id === evt.chat_id) {
            setActiveChat(null);
            setMessages([]);
          }
          refreshChatList();
        }
      }
    });

  // Check if user is near the bottom of the messages
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottomSmooth = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setUnreadCount(0); // Reset unread count when scrolling to bottom
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      setUnreadCount(0);
    }
  };

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

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line
  }, []);

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      if (!officesProp || officesProp.length === 0) {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/filesharing/offices/`);
        const data = await res.json();
        setOffices(data);
      }
      const [chatList, archivedList] = await Promise.all([
        listChats(false), // active chats
        listChats(true)   // archived chats
      ]);
      setChats(chatList);
      setArchivedChats(archivedList);
    } catch (e) {
      showToast(e.message || 'Failed to load chats', 'error');
    } finally {
      setLoadingChats(false);
    }
  };

  const refreshChatList = async () => {
    try {
      const [chatList, archivedList] = await Promise.all([
        listChats(false),
        listChats(true)
      ]);
      setChats(chatList);
      setArchivedChats(archivedList);
    } catch (e) {
      // ignore
    }
  };

  const openChat = async (chat) => {
    try {
      if (activeChat) {
        unsubscribe(activeChat.id);
      }
      
      setActiveChat(chat);
      setView('chats');
      setLoadingMessages(true);
      const msgs = await getChatMessages(chat.id);
      setMessages(msgs);
      subscribe(chat.id);
      
      const last = msgs[msgs.length-1];
      if (last) {
        setTimeout(() => readUpTo({ chatId: chat.id, upToMessageId: last.id }), 100);
      }
      setTimeout(scrollToBottom, 100);
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
      
      // The creator becomes admin by default
      const chat = await createGroupChat(groupName, selectedOffices, userId);
      setGroupName('');
      setSelectedOffices([]);
      await openChat(chat);
      showToast('Group created', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAddMembers = async (newMembers) => {
    try {
      if (!activeChat || !activeChat.is_group) return;
      
      await addMembersToGroup(activeChat.id, newMembers);
      showToast('Members added successfully', 'success');
      setShowGroupSettings(false);
    } catch (e) {
      showToast(e.message || 'Failed to add members', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (!activeChat || !activeChat.is_group) return;
      
      await leaveGroup(activeChat.id, userId);
      showToast('You left the group', 'success');
      setActiveChat(null);
      setMessages([]);
      setShowGroupSettings(false);
      refreshChatList();
    } catch (e) {
      showToast(e.message || 'Failed to leave group', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      if (!activeChat || !activeChat.is_group) return;
      
      await deleteGroup(activeChat.id);
      showToast('Group deleted', 'success');
      setActiveChat(null);
      setMessages([]);
      setShowGroupSettings(false);
      refreshChatList();
    } catch (e) {
      showToast(e.message || 'Failed to delete group', 'error');
    }
  };

  ///////// these functions
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
        handleSend('', url);
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

// const handleEmojiSelect = (emoji) => {
//   setInput(prev => prev + emoji);
//   setShowEmojiPicker(false);
// };

  const handleChatAction = async (action, chatId) => {
    try {
      switch(action) {
        case 'archive':
          await updateChatPreferences(chatId, { archived: true });
          showToast('Chat archived', 'success');
          break;
        case 'unarchive':
          await updateChatPreferences(chatId, { archived: false });
          showToast('Chat unarchived', 'success');
          break;
        case 'pin':
          await updateChatPreferences(chatId, { pinned: true });
          showToast('Chat pinned', 'success');
          break;
        case 'unpin':
          await updateChatPreferences(chatId, { pinned: false });
          showToast('Chat unpinned', 'success');
          break;
        case 'delete':
          await updateChatPreferences(chatId, { deleted: true });
          showToast('Chat deleted', 'success');
          break;
        default:
          break;
      }
      
      refreshChatList();
      setShowChatOptions(null);
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
    }
  };

  const toggleOffice = (id) => {
    setSelectedOffices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSend = async (content, voiceNote = null) => {
    if (!activeChat || (!content && !voiceNote)) return;
    
    const tempId = `tmp_${Date.now()}`;
    const tempMsg = {
      id: null,
      temp_id: tempId,
      chat: activeChat.id,
      sender: { 
        id: userInfo.id, 
        first_name: userInfo.first_name, 
        last_name: userInfo.last_name, 
        office_id: myOfficeId 
      },
      content,
      voice_note: voiceNote,
      is_deleted: false,
      created_at: new Date().toISOString(),
      delivered_office_ids: [],
      read_office_ids: [],
    };
    
    setMessages(prev => [...prev, tempMsg]);
    sendMessage({ chatId: activeChat.id, content, voiceNote, tempId });
    
    if (isNearBottom()) {
      setTimeout(scrollToBottomSmooth, 100);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Filter chats based on selected filter and search query
  const filteredChats = useMemo(() => {
    let result = view === 'archived' ? archivedChats : chats;
    
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
          return chat.name?.toLowerCase().includes(query) || 
                 chat.participants?.some(p => p.name.toLowerCase().includes(query));
        } else {
          return chat.participants?.some(p => 
            p.id !== userId && p.name.toLowerCase().includes(query)
          );
        }
      });
    }
    
    // Sort pinned chats first
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.last_message?.created_at || 0) - new Date(a.last_message?.created_at || 0);
    });
  }, [chats, archivedChats, view, filter, searchQuery, userId]);

  return (
    <Modal onClose={() => {
      if (activeChat) unsubscribe(activeChat.id);
      onClose();
     }}>
      <div className="chat-modal">
        <div className="chat-left-container">
          <ChatList
            view={view}
            setView={setView}
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadingChats={loadingChats}
            filteredChats={filteredChats}
            activeChat={activeChat}
            openChat={openChat}
            startDirect={startDirect}
            offices={offices}
            myOfficeId={myOfficeId}
            showChatOptions={showChatOptions}
            setShowChatOptions={setShowChatOptions}
            handleChatAction={handleChatAction}
            groupName={groupName}
            setGroupName={setGroupName}
            selectedOffices={selectedOffices}
            toggleOffice={toggleOffice}
            createGroup={createGroup}
            userInfo={userInfo}
          />
        </div>
        
        <div className="chat-right-container">
          {activeChat ? (
            <>
              <ChatHeader
                activeChat={activeChat}
                userInfo={userInfo}
                setShowGroupSettings={setShowGroupSettings}
              />
              
              <MessageList
                messages={messages}
                loadingMessages={loadingMessages}
                activeChat={activeChat}
                userInfo={userInfo}
                myOfficeId={myOfficeId}
                messagesContainerRef={messagesContainerRef}
                bottomRef={bottomRef}
                editMessage={editMessage}
                deleteMessageForAll={deleteMessageForAll}
                deleteMessageForMe={deleteMessageForMe}
                computeStatus={computeStatus}
                isMine={isMine}
                canEditMsg={canEditMsg}
              />
              
              {unreadCount > 0 && (
                <div className="unread-indicator" onClick={scrollToBottom}>
                  {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
                </div>
              )}
              
              <MessageComposer
                input={input}
                setInput={setInput}
                recording={recording}
                handleSend={handleSend}
                startRecording={startRecording}
                stopRecording={stopRecording}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
              />
            </>
          ) : (
            <div className="empty-state">Select or create a chat to start messaging.</div>
          )}
        </div>
      </div>
      
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect} 
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      {showGroupSettings && activeChat && (
        <GroupSettingsModal
          chat={activeChat}
          userInfo={userInfo}
          offices={offices}
          onAddMembers={handleAddMembers}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
      
      {showChatOptions && (
        <ChatOptionsModal
          chat={showChatOptions}
          onAction={handleChatAction}
          onClose={() => setShowChatOptions(null)}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Modal>
  );
}

// Helper functions
function computeStatus(msg, activeChat, myOfficeId) {
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

function isMine(msg, userId) {
  return msg.sender?.id === userId;
}

function canEditMsg(msg, userId) {
  return msg?.can_edit && msg.sender?.id === userId && !msg.is_deleted;
}