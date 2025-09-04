import React, { useState } from "react";
import { 
  FaHome, FaPaperPlane, FaInbox, FaFolder, 
  FaUser, FaCog, FaSignOutAlt, FaBars, FaTimes 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import { useAuth } from '../services/AuthContext';

/**
 * Sidebar navigation component for the FileShare app.
 * Handles tab navigation and user logout with JWT.
 */
const Sidebar = ({ activeTab, onTabChange}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Controls mobile menu visibility
  const navigate = useNavigate(); // Used for redirecting after logout
  const {logout} = useAuth(); // our own created hook

  // Navigation items at the top of the sidebar
  const navItems = [
    { icon: <FaHome size={18} />, label: "Recent", tab: "recent" },
    { icon: <FaPaperPlane size={18} />, label: "Sent", tab: "sent" },
    { icon: <FaInbox size={18} />, label: "Received", tab: "received", badge: false },
    // { icon: <FaFolder size={18} />, label: "My Files", tab: "files" },
  ];

  // Navigation items at the bottom (profile/settings/logout)
  const bottomItems = [
    { icon: <FaUser size={18} />, label: "Profile", tab: "profile" },
    { icon: <FaCog size={18} />, label: "Settings", tab: "settings" },
    { icon: <FaSignOutAlt size={18} />, label: "Logout", tab: "logout" },
  ];


  

  return (
    <>
      {/* Hamburger Button (for mobile) */}
      <button 
        className={`hamburger-btn ${isMobileOpen ? "open" : ""}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay when sidebar is open on mobile */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Logo section */}
        <div className="sidebar__logo">
          <FaFolder size={22} />
          <span>FileShare</span>
        </div>

        {/* Main navigation items */}
        <div className="sidebar__nav">
          {navItems.map((item) => (
            <div
              key={item.tab}
              className={`sidebar__item ${activeTab === item.tab ? "active" : ""}`}
              onClick={() => {
                onTabChange(item.tab);
                setIsMobileOpen(false); // Close on mobile after selection
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <div className="sidebar__badge"></div>}
            </div>
          ))}
        </div>

        <hr className="sidebar__divider" />

        {/* Bottom section: profile, settings, logout */}
        <div className="sidebar__bottom">
          {bottomItems.map((item) => (
            <div
              key={item.tab}
              className="sidebar__item"
              onClick={() => {
                if (item.tab === "logout") {
                  logout();
                } else if (item.tab === "profile") {
                  navigate("/dashboard/profile"); // ✅ Navigate to Profile page
                } else if (item.tab === "settings") {
                  navigate("/dashboard/settings"); // Optional: for future
                }
                setIsMobileOpen(false); // Close mobile menu
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
