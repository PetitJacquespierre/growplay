import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Sliders, Headphones, 
  FolderDown, Music, LayoutTemplate, Globe, Database,
  PlayCircle, BarChart3, Clock, Search, ListMusic, CheckCircle2, Circle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';

// --- COMPONENTES UI REUTILIZABLES ---

const Toggle = ({ active, onChange }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onChange(!active); }}
    className={`w-12 h-6 md:w-14 md:h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${active ? 'bg-cyan-neon/20' : 'bg-gray-800'}`}
  >
    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6 md:translate-x-7 bg-cyan-neon' : 'translate-x-0 bg-gray-400'}`}></div>
  </div>
);

const RadioGroup = ({ options, selected, onChange }) => (
  <div className="mt-3 flex gap-2">
    {options.map(opt => (
      <button 
        key={opt.id}
        onClick={(e) => { e.stopPropagation(); onChange(opt.id); }}
        className={`flex-1 py-2 px-1 text-sm font-bold rounded-lg border transition-all ${
          selected === opt.id 
            ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10' 
            : 'border-[#252830] text-gray-400 hover:border-gray-500'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const RadioList = ({ options, selected, onChange }) => (
  <div className="flex flex-col gap-1">
    {options.map(opt => (
      <div 
        key={opt.id}
        onClick={() => onChange(opt.id)}
        className="flex items-start gap-4 p-4 hover:bg-[#1a1d26] rounded-xl cursor-pointer transition"
      >
        <div className="mt-1">
          {selected === opt.id ? (
            <CheckCircle2 size={24} className="text-cyan-neon" />
          ) : (
            <Circle size={24} className="text-gray-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={`text-base font-bold ${selected === opt.id ? 'text-white' : 'text-gray-300'}`}>{opt.title}</h4>
          {opt.subtitle && <p className="text-sm text-gray-500 mt-1 leading-tight">{opt.subtitle}</p>}
        </div>
      </div>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-[11px] text-gray-500 font-bold tracking-[0.15em] mb-3 mt-8 uppercase ml-2 px-2">
    {children}
  </h3>
);

const SettingsItem = ({ icon: Icon, title, subtitle, right, children, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`w-full flex flex-col p-4 transition-colors ${onClick ? 'cursor-pointer hover:bg-[#1a1d26]' : ''}`}
  >
    <div className="flex items-center gap-4 w-full">
      {Icon && (
        <div className="w-12 h-12 rounded-[14px] bg-[#1a1c23] border border-[#252830]/50 flex items-center justify-center shrink-0">
          <Icon size={22} className={active ? "text-cyan-neon" : "text-gray-400"} />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center truncate pr-4">
        <h4 className="text-[17px] font-semibold text-gray-100 truncate">{title}</h4>
        {subtitle && <p className="text-[13px] text-gray-500 mt-[2px] leading-snug truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 ml-auto flex items-center justify-end">{right}</div>}
    </div>
    {children}
  </div>
);

const Card = ({ children }) => (
  <div className="bg-[#12141a] rounded-[24px] overflow-hidden shadow-lg border border-[#1a1c23]/50">
    {/* Añade separadores sutiles entre los hijos directos */}
    {React.Children.map(children, (child, index) => (
      <React.Fragment key={index}>
        {child}
        {index < React.Children.count(children) - 1 && (
          <div className="h-[1px] bg-[#1a1c23] ml-20" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default function SettingsView() {
  const [view, setView] = useState('main'); // 'main', 'plugins', 'player', 'downloads', 'local', 'interface'
  const { user, logout } = useAuthStore();
  
  // Mocks de estado para que los componentes sean interactivos visualmente
  const [toggles, setToggles] = useState({
    autoCarousel: true, lastFm: false, scanOnStart: true, autoPlay: true, fallbackSearch: true,
    billboardHot: true, billboard200: true, streamingSongs: true, digitalSales: false, radioSongs: false
  });
  const [downloadQuality, setDownloadQuality] = useState('high');
  const [streamQuality, setStreamQuality] = useState('high');
  const [searchSuggestion, setSearchSuggestion] = useState('itunes');
  const [crossfade, setCrossfade] = useState(2);

  const toggle = (key) => setToggles(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = async () => {
    if(window.confirm('¿Seguro que quieres cerrar sesión?')) {
      await logout();
      window.location.reload(); // Recargar para limpiar estados
    }
  };

  // --- CABECERA (HEADER) ---
  const renderHeader = (title, backTo = 'main') => (
    <header className="flex items-center gap-4 mb-2 pt-2 px-2">
      <button onClick={() => setView(backTo)} className="p-2 -ml-2 text-white hover:text-cyan-neon transition rounded-full">
        <ChevronLeft size={28} />
      </button>
      <h2 className="text-[22px] md:text-2xl font-bold text-white tracking-tight">{title}</h2>
    </header>
  );

  // --- VISTAS ---

  const MainView = () => (
    <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
      <header className="flex items-center gap-4 mb-8 pt-4 px-2">
        <button onClick={() => { if(window.setActiveTabGlobal) window.setActiveTabGlobal('home'); }} className="p-2 -ml-2 text-white hover:text-cyan-neon transition rounded-full md:hidden">
          <ChevronLeft size={32} />
        </button>
        <h2 className="text-[28px] font-black text-white tracking-tight">Ajustes</h2>
      </header>

      {/* Tarjeta de Perfil */}
      {user && (
        <Card className="mb-6 bg-gradient-to-br from-[#12141a] to-[#0a0c0f] border-cyan-neon/30">
          <div className="flex items-center p-4 gap-4">
            <img src={user.photoURL} alt="Perfil" className="w-16 h-16 rounded-full border-2 border-cyan-neon shadow-[0_0_15px_rgba(0,229,255,0.2)]" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 text-red-500 text-sm font-bold rounded-full hover:bg-red-500 hover:text-white transition"
            >
              Salir
            </button>
          </div>
        </Card>
      )}

      <Card>
        <SettingsItem 
          icon={Sliders} title="Plugins por defecto" subtitle="Fuentes y prioridad de resolución."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => setView('plugins')}
        />
        <SettingsItem 
          icon={Headphones} title="Ajustes del reproductor" subtitle="Calidad de streaming, reproducción automática, etc."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => setView('player')}
        />
        <SettingsItem 
          icon={FolderDown} title="Descargas" subtitle="Ruta, calidad de descarga y más..."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => setView('downloads')}
        />
        <SettingsItem 
          icon={Music} title="Pistas locales" subtitle="Escanear y gestionar carpetas."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => setView('local')}
        />
      </Card>

      <div className="h-6"></div>

      <Card>
        <SettingsItem 
          icon={LayoutTemplate} title="Interfaz y servicios" subtitle="Ajustes visuales, carrusel automático, etc."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => setView('interface')}
        />
        <SettingsItem 
          icon={Globe} title="Idioma y región" subtitle="Selecciona tu idioma y país."
          right={<ChevronRight size={20} className="text-gray-600" />}
        />
        <SettingsItem 
          icon={Database} title="Almacenamiento" subtitle="Copias de seguridad, caché..."
          right={<ChevronRight size={20} className="text-gray-600" />}
        />
      </Card>
            <div className="flex flex-col justify-center items-center mt-12 mb-8">
          <img src="/assets/GrowPlayLogo.png" alt="Grow Play" className="w-48 opacity-40 drop-shadow-[0_0_10px_rgba(0,229,255,0.1)] mb-2" />
          <p className="text-gray-500 text-sm font-medium tracking-widest">V1.0 BETA</p>
        </div>
      </div>
  );

  const InterfaceView = () => (
    <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
      {renderHeader('Interfaz y servicios')}
      
      <SectionTitle>Pantalla de Inicio</SectionTitle>
      <Card>
        <SettingsItem 
          icon={PlayCircle} title="Carrusel automático" subtitle="Deslizar las listas automáticamente en el inicio."
          right={<Toggle active={toggles.autoCarousel} onChange={() => toggle('autoCarousel')} />}
        />
        <SettingsItem 
          icon={ListMusic} title="Recomendaciones de Last.Fm" subtitle="Sugerencias de Last.FM. Requiere inicio de sesión y reinicio."
          right={<Toggle active={toggles.lastFm} onChange={() => toggle('lastFm')} />}
        />
      </Card>

      <SectionTitle>Visibilidad de listas</SectionTitle>
      <Card>
        <SettingsItem 
          icon={BarChart3} title="Billboard Hot 100" subtitle="Mostrar en el carrusel de inicio."
          right={<Toggle active={toggles.billboardHot} onChange={() => toggle('billboardHot')} />}
        />
        <SettingsItem 
          icon={BarChart3} title="Billboard 200" subtitle="Mostrar en el carrusel de inicio."
          right={<Toggle active={toggles.billboard200} onChange={() => toggle('billboard200')} />}
        />
        <SettingsItem 
          icon={BarChart3} title="Streaming Songs" subtitle="Mostrar en el carrusel de inicio."
          right={<Toggle active={toggles.streamingSongs} onChange={() => toggle('streamingSongs')} />}
        />
        <SettingsItem 
          icon={BarChart3} title="Digital Song Sales" subtitle="Mostrar en el carrusel de inicio."
          right={<Toggle active={toggles.digitalSales} onChange={() => toggle('digitalSales')} />}
        />
        <SettingsItem 
          icon={BarChart3} title="Radio Songs" subtitle="Mostrar en el carrusel de inicio."
          right={<Toggle active={toggles.radioSongs} onChange={() => toggle('radioSongs')} />}
        />
      </Card>
    </div>
  );

  const LocalView = () => (
    <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
      {renderHeader('Pistas locales')}
      
      <SectionTitle>Escaneando</SectionTitle>
      <Card>
        <SettingsItem 
          icon={Sliders} title="Escanear al inicio" subtitle="Escanear música local automáticamente al abrir la app."
          right={<Toggle active={toggles.scanOnStart} onChange={() => toggle('scanOnStart')} />}
        />
        <SettingsItem 
          icon={Clock} title="Último escaneo" subtitle="2026-08-29 00:59"
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => {}}
        />
        <SettingsItem 
          icon={Search} title="Escanear ahora" subtitle="Activar un escaneo manual de la biblioteca."
          onClick={() => { alert('Escaneando disco duro local...'); }}
        />
      </Card>
    </div>
  );

  const DownloadsView = () => (
    <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
      {renderHeader('Descargas')}
      
      <SectionTitle>Calidad</SectionTitle>
      <Card>
        <SettingsItem 
          icon={FolderDown} title="Calidad de descarga" subtitle="Calidad de audio preferida para pistas descargadas."
        >
          <RadioGroup 
            options={[{id: 'low', label: 'Low'}, {id: 'medium', label: 'Medium'}, {id: 'high', label: 'High'}]}
            selected={downloadQuality} onChange={setDownloadQuality}
          />
        </SettingsItem>
      </Card>

      <SectionTitle>Almacenamiento</SectionTitle>
      <Card>
        <SettingsItem 
          icon={FolderDown} title="Carpeta de descargas" subtitle="/storage/emulated/0/Android/data/com.growplay.app/files/downloads"
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => {}}
        />
      </Card>
    </div>
  );

  const PlayerView = () => {
    const { intervalMode, toggleIntervalMode } = usePlayerStore();
    return (
      <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
        {renderHeader('Ajustes del reproductor')}
        
        <Card>
          <SettingsItem 
            icon={Headphones} title="Calidad de streaming" subtitle="Calidad de audio global para reproducción online."
          >
            <RadioGroup 
              options={[{id: 'low', label: 'Baja'}, {id: 'medium', label: 'Media'}, {id: 'high', label: 'Alta'}]}
              selected={streamQuality} onChange={setStreamQuality}
            />
          </SettingsItem>
        </Card>
  
        <SectionTitle>Reproducción y Entrenamiento</SectionTitle>
        <Card>
          <SettingsItem 
            icon={ListMusic} title="Radio Infinita" subtitle="Continuar con canciones similares automáticamente."
            right={<Toggle active={toggles.autoPlay} onChange={() => toggle('autoPlay')} />}
          />
          <SettingsItem 
            icon={Clock} title="Modo Entrenamiento (Próximamente)" subtitle="Reducirá el volumen temporalmente para indicar cambios de ritmo."
            right={<span className="text-[10px] font-bold text-electric-orange uppercase bg-electric-orange/10 px-2 py-1 rounded-full border border-electric-orange/20">En desarrollo</span>}
          />
          <SettingsItem 
            icon={Search} title="Búsqueda de respaldo automática" subtitle="Si falla un plugin, intentar con otro."
            right={<Toggle active={toggles.fallbackSearch} onChange={() => toggle('fallbackSearch')} />}
          />
          <SettingsItem 
            icon={Sliders} title="Crossfade (Fundido)" subtitle="Fundido entre canciones."
          right={<span className="text-cyan-neon font-bold">{crossfade === 0 ? 'Desactivado' : `${crossfade}s`}</span>}
        >
          <div className="mt-4 px-2 mb-2 flex flex-col gap-2">
             <input 
               type="range" min="0" max="12" step="2"
               value={crossfade} onChange={(e) => setCrossfade(parseInt(e.target.value))}
               className="w-full accent-cyan-neon bg-gray-800 h-1 rounded-full appearance-none outline-none"
             />
             <div className="flex justify-between text-[10px] text-gray-500 font-medium px-1">
                <span>Desactivado</span>
                <span>2s</span><span>4s</span><span>6s</span><span>8s</span><span>10s</span><span>12s</span>
             </div>
          </div>
        </SettingsItem>
        <SettingsItem 
          icon={BarChart3} title="Ecualizador" subtitle="Ecualizador paramétrico de 10 bandas (vía FFmpeg)."
          right={<ChevronRight size={20} className="text-gray-600" />} onClick={() => {}}
        />
        </Card>
      </div>
    );
  };

  const PluginsView = () => (
    <div className="animate-in slide-in-from-right-4 duration-200 fade-in px-2 md:px-6 pb-32">
      {renderHeader('Plugins por defecto')}
      
      <SectionTitle>Prioridad de letras</SectionTitle>
      <Card>
        <div className="flex items-center gap-4 p-4">
           <div className="w-8 h-8 rounded-lg bg-[#18332F] text-cyan-neon flex items-center justify-center font-bold shrink-0">1</div>
           <div className="flex-1">
             <h4 className="text-base font-bold text-white">lrcnet</h4>
             <p className="text-xs text-gray-500 mt-1">lyrics-provider.bloomfactory.lrcnet</p>
           </div>
           <Sliders size={20} className="text-gray-600 cursor-grab" />
        </div>
      </Card>

      <SectionTitle>Sugerencias de búsqueda</SectionTitle>
      <Card>
        <RadioList 
          options={[
            { id: 'none', title: 'Ninguno', subtitle: 'Usar solo el historial de búsqueda.' },
            { id: 'itunes', title: 'itunes-search-suggestions', subtitle: 'search-suggestion-provider.bloomfactory.itunessearchsuggestions' },
            { id: 'musicbrainz', title: 'musicbrainz-suggestions', subtitle: 'search-suggestion-provider.bloomfactory.musicbrainzsuggestions' },
            { id: 'ytmusic', title: 'ytmusic-search-suggestion', subtitle: 'search-suggestion-provider.bloomfactory.ytmusicsearchsuggestion' }
          ]}
          selected={searchSuggestion} onChange={setSearchSuggestion}
        />
      </Card>
    </div>
  );

  return (
    <div className="h-full pb-32">
      {view === 'main' && <MainView />}
      {view === 'interface' && <InterfaceView />}
      {view === 'local' && <LocalView />}
      {view === 'downloads' && <DownloadsView />}
      {view === 'player' && <PlayerView />}
      {view === 'plugins' && <PluginsView />}
    </div>
  );
}
