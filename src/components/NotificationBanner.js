export default function NotificationBanner({ notification }) {
    if (!notification) return null;
  
    return (
      <div className={`dashboard-notification ${notification.type}`}>
        {notification.message}
      </div>
    );
  }