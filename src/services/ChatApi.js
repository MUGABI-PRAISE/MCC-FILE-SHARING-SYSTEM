// src/services/chatApi.js
import { authFetch } from './FetchAuth';

const API = `${process.env.REACT_APP_API_URL}/filesharing/chat`;

export async function listChats() {
  const res = await authFetch(`${API}/chats/`);
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

export async function createGroupChat(name, officeIds) {
  const res = await authFetch(`${API}/chats/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'group', name, office_ids: officeIds }),
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
