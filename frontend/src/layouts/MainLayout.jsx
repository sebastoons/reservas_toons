import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, LogIn, Sun, Moon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [dark, setDark]           = useState(() =>
    localStorage.getItem('theme') !== 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Cerrar modal si ya está logueado
  useEffect(() => { if (user) setShowLogin(false); }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('Credenciales incorrectas');
    setLoading(false);
  };

  return (
    <div className="layout-container">
      <header className="main-header">
        <div className="header-left">
          <div className="logo-mark">ST</div>
          <span className="logo-text">ServiTrak</span>
        </div>

        <div className="header-right">
          <button className="btn-theme" onClick={() => setDark(d => !d)} title="Cambiar tema">
            {dark ? <Sun size={17}/> : <Moon size={17}/>}
          </button>

          {user ? (
            <>
              <div className="user-info">
                <span className="user-name">{user.first_name} {user.last_name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="btn-header-action" onClick={logout} title="Cerrar sesión">
                <LogOut size={16}/>
              </button>
            </>
          ) : (
            <button className="btn-ingresar" onClick={() => { setShowLogin(true); setError(''); }}>
              <LogIn size={15}/> Ingresar
            </button>
          )}
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>

      {/* ── MODAL DE LOGIN ── */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Acceso al sistema</h3>
              <button onClick={() => setShowLogin(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="lm-group">
                <label>Email</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  placeholder="usuario@email.com" autoFocus />
              </div>
              <div className="lm-group">
                <label>Contraseña</label>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" />
              </div>
              {error && <p className="lm-error">{error}</p>}
              <button type="submit" className="lm-submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
