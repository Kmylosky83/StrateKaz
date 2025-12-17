import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '@/utils/cn';
import { useRouteTracker } from '@/hooks/useLastRoute';

export const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Persistir última ruta visitada para landing inteligente
  useRouteTracker();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 pt-16 min-h-screen flex flex-col',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6 flex-1">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};
