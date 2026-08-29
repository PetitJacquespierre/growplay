import React, { useState } from 'react';
import PlayerBar from '../player/PlayerBar';
import HomeView from '../views/HomeView';
import SettingsView from '../views/SettingsView';
import ExploreView from '../views/ExploreView';
import LocalView from '../views/LocalView';
import FavoritesView from '../views/FavoritesView';
import LibraryView from '../views/LibraryView';
import { Home, Search, Library, FolderDown, Settings, Menu } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const { currentTrack, isExpanded } = usePlayerStore();

  // Exponer para el botón atrás de Ajustes
  React.useEffect(() => {
    window.setActiveTabGlobal = setActiveTab;
  }, []);

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'library', icon: Library, label: 'Biblioteca' },
    { id: 'search', icon: Search, label: 'Buscar' },
    { id: 'local', icon: FolderDown, label: 'Local' }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-oled-black text-white font-sans overflow-hidden relative">
      
      {/* Contenedor Superior (Menú + Contenido) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Área Central (Scrollable) */}
        <main className={`flex-1 overflow-y-auto bg-[#0a0c0f] relative ${currentTrack && !isExpanded ? 'pb-24' : ''}`}>
          {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
          {activeTab === 'search' && <ExploreView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'library' && <LibraryView setActiveTab={setActiveTab} />}
          {activeTab === 'favorites' && <FavoritesView setActiveTab={setActiveTab} />}
          {activeTab === 'local' && <LocalView />}
        </main>
      </div>

      {/* Reproductor - Flotante encima de todo (o anclado al bottom) */}
      <div className="absolute bottom-[72px] md:bottom-0 left-0 right-0 z-50">
        <PlayerBar />
      </div>

      {/* Navegación Móvil (Oculta si el reproductor está expandido en pantalla completa) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-[#12141a] border-t border-[#1a1c23] flex justify-between items-center px-4 py-2 pb-safe z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 ${isExpanded ? 'translate-y-full' : ''}`}>
         {navItems.map(item => {
             const isActive = activeTab === item.id;
             return (
                <div 
                   key={item.id} 
                   onClick={() => setActiveTab(item.id)}
                   className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ease-out px-4 py-2 rounded-full
                               ${isActive ? 'bg-[#18332F] text-cyan-neon' : 'text-gray-500 hover:text-white'}`}
                >
                   <item.icon size={22} className={isActive ? 'text-cyan-neon' : ''} />
                   {isActive && <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>}
                </div>
             );
         })}
      </nav>

    </div>
  );
}
