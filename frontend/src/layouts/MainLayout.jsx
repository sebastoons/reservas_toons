import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, LogOut } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="layout-container">
      <header className="main-header">
        <div className="header-left">
          <Calendar size={28} />
          <span className="logo-text">ShiftSync</span>
        </div>
        
        <nav className="nav-menu">
          {/* El Calendario lo ven todos */}
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            Calendario
          </NavLink>

          {/* Asignaciones: Solo para Técnicos y Admin */}
          {user?.role !== 'COORD' && (
             <NavLink to="/asignaciones" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
               Asignaciones
             </NavLink>
          )}

          {/* Reservaciones: Solo para Coordinadores y Admin */}
          {user?.role !== 'TECH' && (
            <NavLink to="/reservaciones" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              Reservaciones
            </NavLink>
          )}
        </nav>

        <div className="header-right" style={{display:'flex', alignItems:'center', gap:'14px'}}>
          <div style={{textAlign:'right', fontSize:'0.78rem'}}>
            <div style={{fontWeight:'700', color:'var(--text)'}}>{user?.first_name} {user?.last_name}</div>
            <div style={{color:'var(--gold)', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.05em'}}>{user?.role}</div>
          </div>
          <button onClick={logout} style={{background:'transparent', color:'var(--text-muted)', border:'none', cursor:'pointer'}} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;