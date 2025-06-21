export default function DashboardTabs({ activeTab, unreadCount, onTabChange }) {
    return (
      <div className="dashboard-tabs">
        <button className={activeTab === 'recent' ? 'active' : ''} onClick={() => onTabChange('recent')}>
          Recently Shared
        </button>
        <button className={activeTab === 'received' ? 'active' : ''} onClick={() => onTabChange('received')}>
          Received {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
        <button className={activeTab === 'sent' ? 'active' : ''} onClick={() => onTabChange('sent')}>
          Sent Files
        </button>
      </div>
    );
  }