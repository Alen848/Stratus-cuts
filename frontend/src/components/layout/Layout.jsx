import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';
import Header from './Header';
import Toast from '../ui/Toast';
import { useApp } from '../../context/AppContext';
import styles from '../../styles/layout/Layout.module.css';

export default function Layout() {
  const { isSidebarOpen, closeSidebar, isSidebarCollapsed } = useApp();

  return (
    <div className={`
      ${styles.layout} 
      ${isSidebarCollapsed ? styles.collapsed : ''}
    `}>
      <Sidebar />
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={closeSidebar}
        />
      )}

      <div className={styles.content}>
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}