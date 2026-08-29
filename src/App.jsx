import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import MainLayout from './components/layout/MainLayout';
import LoginView from './components/views/LoginView';
import { useAuthStore } from './store/authStore';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, initAuthListener } = useAuthStore();

  useEffect(() => {
    // Iniciar escucha de sesión en Firebase
    initAuthListener();

    // El splash screen dura 2 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  // Si no hay sesión, mostrar Login. Si la hay, la app principal.
  return (
    <>
      {user ? <MainLayout /> : <LoginView />}
    </>
  );
}

export default App;
