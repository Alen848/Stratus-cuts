import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';
import Header from './Header';
import Toast from '../ui/Toast';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-w)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header />
        <main style={{
          flex: 1,
          padding: '32px',
          maxWidth: '1400px',
          width: '100%',
        }}>
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}