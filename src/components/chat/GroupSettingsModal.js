// src/components/chat/GroupSettingsModal.jsx
import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { pickColor } from './utils/colors';
import { initialsFromName } from './utils/format';

/* GroupSettingsModal: kept similar to your original but upgraded slightly */
export default function GroupSettingsModal({ open, onClose, chat, offices, onAddMembers, onLeaveGroup, onDeleteGroup, currentUserId }) {
  const [selected, setSelected] = useState([]);
  useEffect(() => { if (!open) setSelected([]); }, [open]);
  if (!open || !chat) return null;
  const isAdmin = chat.admin_id === currentUserId;
  const members = chat.participants || [];
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  return (
    <Modal onClose={onClose}>
      <div className="group-settings">
        <h3>Group settings</h3>
        <div className="group-section"><strong>Group:</strong> {chat.name || 'Unnamed group'}</div>
        <div className="group-section">
          <strong>Members ({members.length}):</strong>
          <div className="members-list">
            {members.map(m => (
              <div className="member-row" key={m.id}>
                <div className="member-left">
                  {m.avatar_url ? <img src={m.avatar_url} alt={m.name} /> :
                    <div className="avatar-generated small" style={{ background: pickColor(m.name) }}>
                      <span className="avatar-initials small">{initialsFromName(m.name)}</span>
                    </div>}
                </div>
                <div className="member-mid">{m.id === currentUserId ? `${m.name} (you)` : (m.name || `${m.first_name} ${m.last_name || ''}`)}</div>
                <div className="member-right">{chat.admin_id === m.id ? <span className="badge small">admin</span> : null}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="group-section">
          <strong>Add members</strong>
          <div className="muted">Only the admin can add members</div>
          <div className="office-picker">
            {offices.filter(o => !(members || []).some(m => m.office_id === o.id)).map(o => (
              <label key={o.id} className="office-pill">
                <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                <span>{o.name}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <button className="primary" disabled={!isAdmin || selected.length === 0} onClick={() => onAddMembers(chat, selected)}>Add</button>
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
