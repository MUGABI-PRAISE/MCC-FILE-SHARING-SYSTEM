import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '..styles/Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;