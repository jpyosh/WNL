import React, { useState } from 'react';
import Shop from './pages/Shop';
import Admin from './pages/Admin';

const App: React.FC = () => {
  const [view, setView] = useState<'shop' | 'admin'>('shop');

  if (view === 'admin') {
    return <Admin onBack={() => setView('shop')} />;
  }

  return <Shop onAdminClick={() => setView('admin')} />;
};

export default App;