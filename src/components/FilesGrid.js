import FileCard from './FileCard';

export default function FilesGrid({ activeTab, recentFiles, receivedFiles, sentFiles, selectedFiles, expandedMessages, onFileClick, onToggleMessage }) {
  const files = activeTab === 'recent' ? recentFiles : activeTab === 'received' ? receivedFiles : sentFiles;
  return (
    <div className="files-grid">
      {files.map(file => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={selectedFiles.includes(file.id)}
          isExpanded={expandedMessages[file.id]}
          onClick={() => onFileClick(file)}
          onToggleMessage={(e) => {
            e.stopPropagation();
            onToggleMessage(file.id);
          }}
        />
      ))}
    </div>
  );
}