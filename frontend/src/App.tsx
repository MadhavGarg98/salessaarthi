import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Chats from './pages/Chats';
import Checkout from './pages/Checkout';

type Page = 'dashboard' | 'products' | 'orders' | 'chats' | 'analytics';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const path = window.location.pathname;
  const isCheckoutPage = path.startsWith('/pay/');
  const checkoutOrderId = isCheckoutPage ? path.split('/pay/')[1] : null;

  if (isCheckoutPage) {
    return <Checkout orderId={checkoutOrderId} />;
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'products':
        return 'Products Management';
      case 'orders':
        return 'Orders Management';
      case 'chats':
        return 'Customer Chats';
      case 'analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'chats':
        return <Chats />;
      case 'analytics':
        return <Dashboard />; // For now, use Dashboard as placeholder
      default:
        return <Dashboard />;
    }
  };

  // Chats page has full-screen layout, others use sidebar layout
  if (currentPage === 'chats') {
    return <Chats onBack={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem={currentPage} onItemClick={(item) => setCurrentPage(item as Page)} />
      
      {/* Main Content Area */}
      <div className="flex flex-col" style={{
        marginLeft: '256px',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        {/* Top Bar */}
        <TopBar title={getPageTitle()} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
