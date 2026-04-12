import Sidebar from './Sidebar';

const STYLES = `
  .sa-app-layout {
    display: flex;
    min-height: 100vh;
    background: #0f1117;
  }

  .sa-content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }
`;

export default function Layout({ children }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="sa-app-layout">
        <Sidebar />
        <main className="sa-content">
          {children}
        </main>
      </div>
    </>
  );
}
