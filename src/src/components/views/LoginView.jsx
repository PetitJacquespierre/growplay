import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Music, LogIn } from 'lucide-react';

export default function LoginView() {
  const { loginWithGoogle, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0c0f] flex items-center justify-center">
        <style>{`
          @keyframes pulse-zoom {
            0%, 100% { transform: scale(1); opacity: 0.8; filter: drop-shadow(0 0 10px rgba(0,229,255,0.2)); }
            50% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 25px rgba(0,229,255,0.6)); }
          }
        `}</style>
        <img 
          src="/assets/GrowPlayIsotipo.png" 
          alt="Cargando" 
          className="w-20 h-20 object-contain"
          style={{ animation: 'pulse-zoom 1.5s ease-in-out infinite' }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0c0f] text-white relative overflow-hidden items-center justify-center p-6">
      
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-cyan-neon/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-electric-orange/10 rounded-full blur-[80px]"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-sm">
        <img src="/assets/GrowPlayLogo.png" alt="Grow Play" className="w-64 drop-shadow-[0_0_20px_rgba(0,229,255,0.2)] mb-12" />
        
        <h1 className="text-3xl font-black mb-2 text-center">Tu Música,<br/>Tus Reglas</h1>
        <p className="text-gray-400 text-center mb-10 text-sm">Inicia sesión para sincronizar tus carpetas, favoritos y descargas en la nube.</p>

        <button 
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-full hover:scale-105 active:scale-95 transition shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
        >
          <LogIn size={24} />
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  );
}
