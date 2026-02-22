import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './MyAssignments.css';

const MyAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Cargar las citas asignadas al técnico logueado
    const fetchAssignments = async () => {
        try {
            const res = await api.get('/appointments/');
            // Filtramos en frontend o backend. Como el backend ya filtra por usuario (views.py), 
            // aquí recibimos solo las de este técnico.
            setAssignments(res.data);
        } catch {
            // CORRECCIÓN: Quitamos (error) para evitar la advertencia de "unused variable"
            console.error("Error cargando asignaciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    // 2. Función para aceptar o rechazar
    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.patch(`/appointments/${id}/status/`, {
                status: newStatus,
                technician_message: newStatus === 'ACCEPTED' ? 'Confirmado' : 'No disponible'
            });
            // Recargar la lista para ver el cambio
            fetchAssignments(); 
            alert(`Trabajo ${newStatus === 'ACCEPTED' ? 'ACEPTADO' : 'RECHAZADO'} correctamente`);
        } catch {
            // CORRECCIÓN: Quitamos (error) aquí también
            alert("Error al actualizar estado");
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