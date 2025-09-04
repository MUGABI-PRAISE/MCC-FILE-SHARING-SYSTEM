// src/services/ChatApi.js
import { authFetch } from './FetchAuth';

const API = `${process.env.REACT_APP_API_URL}/filesharing/chat`;

export async function listChats(archived = false) {
  const res = await authFetch(`${API}/chats/?archived=${archived}`);
  if (!res.ok) throw new Error('Failed to load chats');
  return res.json();
}

export async function createDirectChat(officeId) {
  const res = await authFetch(`${API}/chats/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'direct', office_id: officeId }),
  });
  if (!res.ok) throw new Error('Failed to create/open direct chat');
  return res.json();
}

export async function createGroupChat(name, officeIds, adminId) {
  const res = await authFetch(`${API}/chats/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'group', 
      name, 
      office_ids: officeIds,
      admin_id: adminId 
    }),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function getChatMessages(chatId) {
  const res = await authFetch(`${API}/chats/${chatId}/messages/`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function uploadVoiceNote(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`${API}/voice/upload/`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Voice upload failed');
  return res.json(); // { url }
}

export async function addMembersToGroup(chatId, officeIds) {
  const res = await authFetch(`${API}/chats/${chatId}/members/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ office_ids: officeIds }),
  });
  if (!res.ok) throw new Error('Failed to add members to group');
  return res.json();
}

export async function leaveGroup(chatId, userId) {
  const res = await authFetch(`${API}/chats/${chatId}/leave/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to leave group');
  return res.json();
}

export async function deleteGroup(chatId) {
  const res = await authFetch(`${API}/chats/${chatId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete group');
  return res.json();
}

export async function updateChatPreferences(chatId, preferences) {
  const res = await authFetch(`${API}/chats/${chatId}/preferences/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error('Failed to update chat preferences');
  return res.json();
}

export async function sendMessage(chatId, content, voiceNote = null) {
  const res = await authFetch(`${API}/chats/${chatId}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, voice_note: voiceNote }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function editMessage(messageId, newContent) {
  const res = await authFetch(`${API}/messages/${messageId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: newContent }),
  });
  if (!res.ok) throw new Error('Failed to edit message');
  return res.json();
}

export async function deleteMessageForAll(messageId) {
  const res = await authFetch(`${API}/messages/${messageId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete message');
  return res.json();
}

export async function deleteMessageForMe(messageId) {
  const res = await authFetch(`${API}/messages/${messageId}/hide/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to hide message');
  return res.json();
}

export async function markMessagesAsRead(chatId, upToMessageId) {
  const res = await authFetch(`${API}/chats/${chatId}/read/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ up_to_message_id: upToMessageId }),
  });
  if (!res.ok) throw new Error('Failed to mark messages as read');
  return res.json();
}