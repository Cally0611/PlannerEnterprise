import React, { useState } from 'react';
import './styles/global.css';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';

const App = () => {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);

  const handleLogin = (u) => {
    setUser(u);
    setPage('upload');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  return (
    <>
      {page === 'login' && <LoginPage onLogin={handleLogin} />}
      {page === 'upload' && user && <UploadPage user={user} onLogout={handleLogout} />}
    </>
  );
};

export default App;
