import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './MyAssignments.css';

const MyAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignments = async () => {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('technician_id', user.id)
            .order('date', { ascending: true });
        if (!error) setAssignments(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        const { error } = await supabase
            .from('appointments')
            .update({
                status: newStatus,
                technician_message: newStatus === 'ACCEPTED' ? 'Confirmado' : 'No disponible'
            })
            .eq('id', id);
        if (error) {
            alert("Error al actualizar estado");
        } else {
            fetchAssignments();
            alert(`Trabajo ${newStatus === 'ACCEPTED' ? 'ACEPTADO' : 'RECHAZADO'} correctamente`);
        }
    };

    if (loading) return <div style={{padding:'20px'}}>Cargando agenda...</div>;

    return (
        <div className="assignments-container">
            <h2 style={{marginBottom: '20px'}}>Mis Asignaciones de Trabajo</h2>
            
            {assignments.length === 0 ? (
                <p>No tienes trabajos asignados por el momento.</p>
            ) : (
                assignments.map(item => (
                    <div key={item.id} className="assignment-card">
                        <div className="card-header">
                            <span className="client-name">{item.client_name}</span>
                            <span className={`status-badge status-${item.status}`}>
                                {item.status === 'PENDING' && 'En Espera'}
                                {item.status === 'ACCEPTED' && 'Aceptado'}
                                {item.status === 'REJECTED' && 'Rechazado'}
                                {item.status === 'COMPLETED' && 'Completado'}
                            </span>
                        </div>
                        
                        <div className="card-body">
                            <p><strong>Fecha:</strong> {item.date} a las {item.time}</p>
                            <p><strong>Dirección:</strong> {item.address}</p>
                            <p><strong>Trabajo:</strong> {item.work_type}</p>
                            <p><strong>Descripción:</strong> {item.description}</p>
                        </div>

                        {/* Solo mostrar botones si está Pendiente */}
                        {item.status === 'PENDING' && (
                            <div className="card-actions">
                                <button 
                                    className="btn-reject"
                                    onClick={() => handleStatusChange(item.id, 'REJECTED')}
                                >
                                    Rechazar
                                </button>
                                <button 
                                    className="btn-accept"
                                    onClick={() => handleStatusChange(item.id, 'ACCEPTED')}
                                >
                                    Aceptar Trabajo
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default MyAssignments;