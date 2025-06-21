import { useState } from 'react';
import '../styles/SendConfirmation.css';

export default function SendConfirmation({ 
  file, 
  offices, 
  selectedOffice, 
  onOfficeSelect, 
  onSend, 
  onBack 
}) {
  const [finalMessage, setFinalMessage] = useState(file.message || '');

  const handleSend = () => {
    if (!selectedOffice) {
      alert('Please select an office');
      return;
    }
    onSend({
      ...file,
      message: finalMessage
    });
  };

  return (
    <div className="confirmation-container">
      <h2>Confirm and Send</h2>
      
      <div className="file-preview">
        <div className="file-icon">
          {file.type === 'pdf' && <span className="pdf">PDF</span>}
          {file.type === 'doc' && <span className="doc">DOC</span>}
          {file.type === 'ppt' && <span className="ppt">PPT</span>}
          {file.type === 'txt' && <span className="txt">TXT</span>}
        </div>
        <div className="file-info">
          <h3>{file.name}</h3>
          <p>{file.size}</p>
        </div>
      </div>

      <div className="form-group">
        <label>Message (optional):</label>
        <textarea
          value={finalMessage}
          onChange={(e) => setFinalMessage(e.target.value)}
          placeholder="Add a message (optional)"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Send to Office:</label>
        <select 
          value={selectedOffice} 
          onChange={(e) => onOfficeSelect(e.target.value)}
        >
          <option value="">Select an office</option>
          {offices.map(office => (
            <option key={office.id} value={office.id}>
              {office.name}
            </option>
          ))}
        </select>
      </div>

      <div className="action-buttons">
        <button className="secondary-button" onClick={onBack}>
          ← Back
        </button>
        <button 
          className="primary-button" 
          onClick={handleSend}
          disabled={!selectedOffice}
        >
          Send File
        </button>
      </div>
    </div>
  );
}