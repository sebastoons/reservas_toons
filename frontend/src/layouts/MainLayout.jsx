import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Calendar, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout-container">
      <header className="main-header">
        <div className="header-left">
          <Calendar size={22} color="var(--gold)" />
          <span className="logo-text">ServiTrak</span>
        </div>

        <div className="header-right">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-name">{user.first_name} {user.last_name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="btn-header-action" onClick={logout} title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="btn-ingresar" onClick={() => navigate('/login')}>
              <LogIn size={15} />
              Ingresar
            </button>
          )}
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
