import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaTachometerAlt, FaTruck, FaBook, FaList,
  FaFileAlt, FaExchangeAlt, FaBox, FaBuilding,
  FaSignOutAlt, FaBars, FaTimes, FaUsers,
  FaStickyNote, FaWhatsapp, FaExpandAlt, FaCompressAlt
} from 'react-icons/fa';
import logoImg from '../../assets/logo.png';
import './Layout.css';

interface LayoutProps { children: React.ReactNode; }

const allMenuItems = [
  { id: 'inicio',        path: '/',              icon: FaTachometerAlt, label: 'Dashboard',        roles: ['ADMIN','ALMACEN','AUTORIZADOR','COMPRAS','USUARIO'] },
  { id: 'productos',     path: '/productos',     icon: FaBox,           label: 'Productos',        roles: ['ADMIN','ALMACEN'] },
  { id: 'movimientos',   path: '/movimientos',   icon: FaExchangeAlt,   label: 'Movimientos',      roles: ['ADMIN','ALMACEN','COMPRAS'] },
  { id: 'activos',       path: '/activos',       icon: FaBuilding,      label: 'Activos',          roles: ['ADMIN','ALMACEN'] },
  { id: 'proveedores',   path: '/proveedores',   icon: FaTruck,         label: 'Proveedores',      roles: ['ADMIN','ALMACEN'] },
  { id: 'centros-costo', path: '/centros-costo', icon: FaList,          label: 'Centros de Costo', roles: ['ADMIN','ALMACEN'] },
  { id: 'requisiciones', path: '/requisiciones', icon: FaFileAlt,       label: 'Requisiciones',    roles: ['ADMIN','ALMACEN','AUTORIZADOR','USUARIO'] },
  { id: 'catalogo',      path: '/catalogo',      icon: FaList,          label: 'Catálogo',         roles: ['ADMIN','ALMACEN'] },
  { id: 'bitacora',      path: '/bitacora',      icon: FaBook,          label: 'Bitácora',         roles: ['ADMIN'] },
  { id: 'usuarios',      path: '/usuarios',      icon: FaUsers,         label: 'Usuarios',         roles: ['ADMIN'] },
];

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrador', ALMACEN: 'Almacén',
  AUTORIZADOR: 'Autorizador', COMPRAS: 'Compras', USUARIO: 'Usuario',
};

/* ─── Bloc de notas flotante ─────────────────────────────────────────────── */
function FloatingTools({ role }: { role: string | null }) {
  const [noteOpen, setNoteOpen]         = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [noteText, setNoteText]         = useState('');

  if (role !== 'ALMACEN' && role !== 'ADMIN') return null;

  return (
    <>
      <button title="Bloc de notas" onClick={() => setNoteOpen(o => !o)}
        style={{ position:'fixed', bottom:72, right:20, zIndex:1000,
          width:44, height:44, borderRadius:'50%', background:'#7B4B27',
          color:'white', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 3px 10px rgba(0,0,0,0.3)', fontSize:18 }}>
        <FaStickyNote />
      </button>

      <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer"
        title="Abrir WhatsApp Web"
        style={{ position:'fixed', bottom:20, right:20, zIndex:1000,
          width:44, height:44, borderRadius:'50%', background:'#25D366',
          color:'white', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 3px 10px rgba(0,0,0,0.3)', textDecoration:'none', fontSize:22 }}>
        <FaWhatsapp />
      </a>

      {noteOpen && (
        <div style={{ position:'fixed',
          bottom: noteExpanded ? 20 : 124,
          right:  noteExpanded ? 20 : 72,
          width:  noteExpanded ? 'calc(100vw - 280px)' : 300,
          height: noteExpanded ? 'calc(100vh - 100px)' : 220,
          background:'#fffde7', border:'1px solid #f0c040', borderRadius:10,
          boxShadow:'0 4px 20px rgba(0,0,0,0.2)', zIndex:1001,
          display:'flex', flexDirection:'column', overflow:'hidden', transition:'all 0.2s ease' }}>
          <div style={{ background:'#7B4B27', color:'white', padding:'6px 10px',
            display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:700 }}>
            <span><FaStickyNote style={{ marginRight:6 }} />Mis Notas</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setNoteExpanded(e => !e)}
                style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:12 }}
                title={noteExpanded ? 'Reducir' : 'Expandir'}>
                {noteExpanded ? <FaCompressAlt /> : <FaExpandAlt />}
              </button>
              <button onClick={() => setNoteOpen(false)}
                style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:14, fontWeight:900 }}>
                ×
              </button>
            </div>
          </div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Escribe tus notas aquí..."
            style={{ flex:1, padding:10, border:'none', resize:'none', background:'#fffde7',
              fontFamily:'Arial, sans-serif', fontSize:13, lineHeight:1.5, outline:'none', color:'#333' }} />
          <div style={{ padding:'3px 10px', fontSize:10, color:'#aaa', background:'#fff9c4', borderTop:'1px solid #f0e080' }}>
            {noteText.length} caracteres · Las notas se guardan en esta sesión
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Layout principal ───────────────────────────────────────────────────── */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, currentEnvironment, role, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cerrar drawer al navegar
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const menuItems = allMenuItems.filter(item => !role || item.roles.includes(role));

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const activeId = menuItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id;

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  // En mobile: collapsed siempre false (drawer es full)
  const sidebarCollapsed = isMobile ? false : collapsed;

  return (
    <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''} ${mobileOpen ? 'layout--mobile-open' : ''}`}>

      {/* Overlay oscuro en móvil */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <img src={logoImg} alt="Logo" className="sidebar__logo-img" />
            {!sidebarCollapsed && <span className="sidebar__logo-text">MILPILLAS</span>}
          </div>
          <button className="sidebar__toggle"
            onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}>
            {(isMobile || !collapsed) ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {!sidebarCollapsed && currentEnvironment && (
          <div className="sidebar__env">
            <span className="sidebar__env-name">{currentEnvironment.environment?.name || 'Entorno'}</span>
            <span className="sidebar__env-role">{roleLabel[role || ''] || role}</span>
          </div>
        )}

        <nav className="sidebar__nav">
          {menuItems.map(item => (
            <button key={item.id}
              className={`nav-item ${activeId === item.id ? 'nav-item--active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              title={sidebarCollapsed ? item.label : undefined}>
              <div className="nav-item__indicator" />
              <div className="nav-item__content">
                <item.icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          {!sidebarCollapsed && (
            <div className="sidebar__user">
              <span>{user?.email}</span>
            </div>
          )}
          <button className="sidebar__logout" onClick={handleLogout} title="Cerrar sesión">
            <FaSignOutAlt size={16} />
            {!sidebarCollapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="main__topbar">
          <div className="main__topbar-left">
            {/* Botón hamburguesa — solo en móvil */}
            <button className="topbar__menu-btn" onClick={() => setMobileOpen(true)}>
              <FaBars />
            </button>
            <h2 className="main__page-title">
              {menuItems.find(i => i.id === activeId)?.label || 'ERP'}
            </h2>
          </div>
          <div className="main__topbar-right">
            <span className="main__date">
              {new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </span>
            {role && <span className="main__role-badge">{roleLabel[role] || role}</span>}
          </div>
        </div>
        <div className="main__content">
          {children}
        </div>
      </main>

      <FloatingTools role={role} />
    </div>
  );
};
