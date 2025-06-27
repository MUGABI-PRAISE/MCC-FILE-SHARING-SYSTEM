import React, { useState } from "react";
import { 
  FaHome, FaPaperPlane, FaInbox, FaFolder, 
  FaUser, FaCog, FaSignOutAlt, FaBars, FaTimes 
} from "react-icons/fa";
import "../styles/Sidebar.css";

const Sidebar = ({ activeTab, onTabChange }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: <FaHome size={18} />, label: "Recent", tab: "recent" },
    { icon: <FaPaperPlane size={18} />, label: "Sent", tab: "sent" },
    { icon: <FaInbox size={18} />, label: "Received", tab: "received", badge: true },
    { icon: <FaFolder size={18} />, label: "My Files", tab: "files" },
  ];

  const bottomItems = [
    { icon: <FaUser size={18} />, label: "Profile", tab: "profile" },
    { icon: <FaCog size={18} />, label: "Settings", tab: "settings" },
    { icon: <FaSignOutAlt size={18} />, label: "Logout", tab: "logout" },
  ];

  return (
    <>
      {/* Transparent Hamburger Button */}
      <button 
        className={`hamburger-btn ${isMobileOpen ? "open" : ""}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay when sidebar is open */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar__logo">
          <FaFolder size={22} />
          <span>FileShare</span>
        </div>

        <div className="sidebar__nav">
          {navItems.map((item) => (
            <div
              key={item.tab}
              className={`sidebar__item ${activeTab === item.tab ? "active" : ""}`}
              onClick={() => {
                onTabChange(item.tab);
                setIsMobileOpen(false); // Close sidebar on mobile after selection
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <div className="sidebar__badge"></div>}
            </div>
          ))}
        </div>

        <hr className="sidebar__divider" />

        <div className="sidebar__bottom">
          {bottomItems.map((item) => (
            <div
              key={item.tab}
              className="sidebar__item"
              onClick={() => {
                console.log(`Navigate to ${item.tab}`);
                setIsMobileOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;