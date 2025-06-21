export default function SelectedActions({ selectedFiles }) {
    if (selectedFiles.length === 0) return null;
  
    return (
      <div className="file-actions">
        <button className="action-button download">
          Download Selected ({selectedFiles.length})
        </button>
        <button className="action-button share">Share Selected</button>
        <button className="action-button delete">Delete Selected</button>
      </div>
    );
  }
  