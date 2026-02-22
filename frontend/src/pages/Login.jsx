import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Obtenemos el Token JWT
            const resToken = await api.post('/token/', { email, password });
            localStorage.setItem('token', resToken.data.access);

            // 2. Obtenemos los datos del usuario (incluyendo el ROL)
            const resUser = await api.get('/users/me/');
            setUser(resUser.data);

            // 3. Redirección inteligente basada en Rol
            if (resUser.data.role === 'ADMIN') navigate('/dashboard');
            else if (resUser.data.role === 'TECH') navigate('/dashboard'); // Verá su agenda propia
            else navigate('/dashboard'); // Coordinador verá su panel de reservas

        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert('Credenciales incorrectas o error de conexión');
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
                    <button type="submit" className="submit-btn">Entrar al Sistema</button>
                </form>
            </div>
        </div>
    );
};

export default Login;