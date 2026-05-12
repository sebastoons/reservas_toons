import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ReservationForm.css';

const ReservationForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estado inicial igual al modelo de Django
    const [formData, setFormData] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        address: '',
        technician: '', // Aquí guardaremos el ID del técnico seleccionado
        work_type: 'INST',
        date: '',
        time: '',
        duration_estimated: '1 Hora 30 Minutos',
        assigned_by_name: '', // Nombre del coordinador (opcional, o auto-rellenable)
        description: ''
    });

    // 1. Cargar técnicos al montar el componente
    useEffect(() => {
        const fetchTechs = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .eq('role', 'TECH');
            if (!error) setTechnicians(data);
        };
        fetchTechs();
    }, []);

    // 2. Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 3. Enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('appointments').insert({
            coordinator_id: user.id,
            technician_id: formData.technician,
            client_name: formData.client_name,
            client_email: formData.client_email,
            client_phone: formData.client_phone,
            address: formData.address,
            work_type: formData.work_type,
            description: formData.description,
            assigned_by_name: formData.assigned_by_name,
            date: formData.date,
            time: formData.time,
            duration_estimated: formData.duration_estimated,
        });
        setLoading(false);
        if (error) {
            alert('Error al crear la reserva. Verifique los datos.');
        } else {
            alert('¡Solicitud enviada con éxito!');
            navigate('/dashboard');
        }
    };

    return (
        <div className="form-card">
            <div className="form-header">
                <h2>Solicitar Reserva</h2>
                <p>Complete los detalles para programar una nueva reserva de servicio.</p>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
                {/* Columna Izquierda: Datos del Cliente */}
                <div className="form-group">
                    <label>Nombre Cliente *</label>
                    <input type="text" name="client_name" className="form-control" placeholder="Empresa X S.A." required onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Fecha *</label>
                    <input type="date" name="date" className="form-control" required onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Dirección *</label>
                    <input type="text" name="address" className="form-control" placeholder="Calle Falsa 123" required onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Hora *</label>
                    <input type="time" name="time" className="form-control" required onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Correo Electrónico *</label>
                    <input type="email" name="client_email" className="form-control" placeholder="contacto@empresa.com" required onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Teléfono de Contacto</label>
                    <input type="text" name="client_phone" className="form-control" placeholder="+56 9 1234 5678" onChange={handleChange} />
                </div>

                {/* Selección de Técnico */}
                <div className="form-group">
                    <label>Técnico Asignado *</label>
                    <select name="technician" className="form-control" required onChange={handleChange} value={formData.technician}>
                        <option value="">Seleccione un técnico...</option>
                        {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>
                                {tech.first_name} {tech.last_name} ({tech.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Tipo de Trabajo</label>
                    <select name="work_type" className="form-control" onChange={handleChange}>
                        <option value="INST">Instalación</option>
                        <option value="MANT">Mantención</option>
                        <option value="DESINST">Desinstalación</option>
                        <option value="REPAR">Reparación</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Nombre persona que asignó</label>
                    <input type="text" name="assigned_by_name" className="form-control" placeholder="Ej: Gerente de Operaciones" onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Duración Estimada</label>
                    <input type="text" name="duration_estimated" className="form-control" defaultValue="1 Hora 30 Minutos" onChange={handleChange} />
                </div>

                {/* Fila completa para Descripción */}
                <div className="form-group full-width">
                    <label>Descripción detallada</label>
                    <textarea name="description" className="form-control" placeholder="Detalles técnicos del trabajo..." onChange={handleChange}></textarea>
                </div>

                <div className="form-actions full-width">
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationForm;