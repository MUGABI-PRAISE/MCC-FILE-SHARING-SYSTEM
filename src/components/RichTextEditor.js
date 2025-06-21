import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/RichTextEditor.css';

export default function RichTextEditor({ content, setContent }) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image'
  ];

  return (
    <div className="rich-text-editor-container">
      <div className="editor-header">
        <h3 className="editor-title">Document Editor</h3>
        <div className="editor-actions">
          <button className="editor-action-btn save-btn">Save</button>
          <button className="editor-action-btn preview-btn">Preview</button>
        </div>
      </div>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        formats={formats}
        className="rich-text-editor"
        placeholder="Start writing your content here..."
      />
      <div className="editor-footer">
        <span className="word-count">{content.split(/\s+/).filter(Boolean).length} words</span>
        <span className="char-count">{content.length} characters</span>
      </div>
    </div>
  );
}