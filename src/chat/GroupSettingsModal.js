// src/components/GroupSettingsModal.js
import React, { useState } from 'react';
import Modal from '../components/Modal';

function GroupSettingsModal({ 
  chat, 
  userInfo, 
  offices, 
  onAddMembers, 
  onLeaveGroup, 
  onDeleteGroup, 
  onClose 
}) {
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const isAdmin = chat.admin_id === userInfo.id;
  const canDelete = chat.participants.length === 1 && chat.participants[0].id === userInfo.id;

  const toggleMemberSelection = (officeId) => {
    setSelectedNewMembers(prev => 
      prev.includes(officeId) 
        ? prev.filter(id => id !== officeId) 
        : [...prev, officeId]
    );
  };

  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) return;
    onAddMembers(selectedNewMembers);
  };

  return (
    <Modal onClose={onClose}>
      <div className="group-settings-modal">
        <h2>Group Settings: {chat.name}</h2>
        
        {isAdmin && (
          <div className="settings-section">
            <h3>Add Members</h3>
            <p>Select offices to add to this group:</p>
            
            <div className="members-selector">
              {offices
                .filter(o => !chat.participants.some(p => p.office_id === o.id))
                .map(o => (
                  <label key={o.id} className="member-option">
                    <input
                      type="checkbox"
                      checked={selectedNewMembers.includes(o.id)}
                      onChange={() => toggleMemberSelection(o.id)}
                    />
                    <span>{o.name}</span>
                  </label>
                ))
              }
            </div>
            
            <button 
              className="primary" 
              onClick={handleAddMembers}
              disabled={selectedNewMembers.length === 0}
            >
              Add Selected Members
            </button>
          </div>
        )}
        
        <div className="settings-section">
          <h3>Danger Zone</h3>
          
          <div className="danger-actions">
            <button className="danger-btn" onClick={onLeaveGroup}>
              Leave Group
            </button>
            
            {canDelete && (
              <button className="danger-btn" onClick={onDeleteGroup}>
                Delete Group
              </button>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

export default GroupSettingsModal;