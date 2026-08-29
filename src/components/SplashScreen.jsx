import React from 'react';

export default function SplashScreen() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-screen bg-oled-black overflow-hidden">
      
      {/* Fondo Ciberpunk / Circuitos (Efecto sutil) */}
      <div 
        className="absolute inset-0 z-0 opacity-20" 
        style={{
          // Un degradado radial cian en el centro para el resplandor
          background: 'radial-gradient(circle at center, rgba(0,229,255,0.15) 0%, transparent 60%)',
        }}
      >
        {/* Patrón sutil de cuadrícula tecnológica */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      {/* Área del Logotipo Principal */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-pulse duration-1000">
        <img 
          src="/assets/GrowPlayLogo.png" 
          alt="Grow Play Logo" 
          className="w-72 md:w-96 object-contain drop-shadow-[0_0_20px_rgba(0,229,255,0.15)]"
        />
      </div>

      {/* Firma Inferior Obligatoria */}
      <div className="absolute bottom-12 z-10 flex flex-col items-center">
        <div className="w-10 h-[1px] bg-cyan-neon mb-3 opacity-50"></div>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">
          Powered by <span className="text-white font-bold">Grow Studio</span>
        </p>
      </div>
    </div>
  );
}
