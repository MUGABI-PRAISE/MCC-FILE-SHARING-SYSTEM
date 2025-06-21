import { useState } from 'react';
import Modal from './Modal';
import RichTextEditor from './RichTextEditor';
import '../styles/FileSender.css';
import Button from './buttons/Button';

export default function FileSender({ offices, onClose, onSendComplete }) {
  const [title, setTitle] = useState(''); // title of the file ( to be sent to the database.)
  const [file, setFile] = useState(null); // file uploaded
  const [message, setMessage] = useState(''); // message attached to the file (to be sent to the database.)
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [mode, setMode] = useState(null);  // used to handle what renders in the model
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!title || selectedOffices.length === 0 || (mode === 'new' && !content) || (mode === 'upload' && !file)) {
      alert('Please fill out all required fields');
      return;
    }

    const sentFile = {
      id: Date.now().toString(),
      name: title,
      type: mode === 'upload' ? file.name.split('.').pop() : 'doc',
      size: mode === 'upload' ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
      date: 'Just now',
      message,
      content: mode === 'new' ? content : null,
      sharedWith: selectedOffices.map(id => offices.find(o => o.id === id).name)
    };

    onSendComplete(sentFile);
    onClose();
  };

  const toggleOffice = (id) => {
    setSelectedOffices(prev =>
      prev.includes(id) ? prev.filter(officeId => officeId !== id) : [...prev, id]
    );
  };

  return (
    <Modal onClose={onClose}>
      {!mode ? (
        <div className="mode-selection">
          <h2 className="modal-title">Send New File</h2>
          <p className="modal-subtitle">Choose how you'd like to create your file</p>

          <div className="mode-options">
            <button className="mode-card" onClick={() => setMode('new')}>
              <div className="mode-icon">📝</div>
              <h3>Create New File</h3>
              <p>Start with a blank document and compose your content</p>
            </button>

            <button className="mode-card" onClick={() => setMode('upload')}>
              <div className="mode-icon">📁</div>
              <h3>Upload File</h3>
              <p>Select an existing file from your device</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="send-form">
          <h2 className="modal-title">
            {mode === 'new' ? 'Create & Send Document' : 'Upload & Send File'}
          </h2>
          {/* title of the document */}
          <div className="form-group">
            <label className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter file title"
            />
          </div>

        {/*****************LOGIC FOR UPLOADING FILES ******************/}
          {mode === 'upload' ? (
            <div className="form-group">
              <label className="form-label">
                Select File <span className="required">*</span>
              </label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  onChange={(e) => setFile(e.target.files[0])}
                  // multiple={true} remember to implement this to upload multiple files
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  {file ? (
                    <>
                      <span className="file-name">{file.name}</span>
                      {/* conversion to MB  given to 1 decimal place */}
                      <span className="file-size">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </>
                  ) : (
                    <>
                    {/* svg icons are set by defining the path in the svg tag */}
                    {/* those codes you see define a path of an icon */}
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M17 8L12 3M12 3L7 8M12 3V15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Click to browse or drag & drop</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
     //////////////////////// LOGIC FOR NEW FILES /////////////////////////
            <div className="form-group">
              <label className="form-label">
                Document Content <span className="required">*</span>
              </label>
              <RichTextEditor content={content} setContent={setContent} />
            </div>
          )}
          {/*
          
            note some pattern here on forms. especially for input fields, and texareas. 
            as you're using them, every letter you type, you are changing a state. ie
            their onChange event is listening to every letter you type.
            then when you're done typing, the final state which is stored in the state
            variable is what goes to the value attribute of these fields. 

            but for forms or buttons, they don't have an onChange event. they have an 
            onClick event. these normally call a function.
          */}
          <div className="form-group">
            <label className="form-label">Optional Message</label>
            <textarea
              className="form-textarea"
              value={message} // the final message. 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message for recipients..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Select Offices <span className="required">*</span>
            </label>
            <div className="office-selection">
              {offices.map(office => (
                <div key={office.id} className="office-option">
                  <input
                    type="checkbox"
                    id={`office-${office.id}`}
                    checked={selectedOffices.includes(office.id)}
                    onChange={() => toggleOffice(office.id)}
                    className="office-checkbox"
                  />
                  <label htmlFor={`office-${office.id}`} className="office-label">
                    {office.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">            
            <Button 
              onClick={handleSend}
              icon = {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              className={"send-button"}
              value={"Send File"}
            />       
            
            <Button onClick={onClose} className={"cancel-button"}  value={"Cancel"} />

          </div>
        </div>
      )}
    </Modal>
  );
}
