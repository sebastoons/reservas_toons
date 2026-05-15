import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            setError('Credenciales incorrectas o error de conexión');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-icon-box"><ShieldCheck size={32} /></div>
                <h2>Sistema de Acceso</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                    </div>
                    {error && <p style={{color:'#d32f2f', fontSize:'0.85rem', margin:'0 0 8px'}}>{error}</p>}
                    <button type="submit" className="submit-btn">Entrar al Sistema</button>
                </form>
            </div>
        </div>
    );
};

export default Login;