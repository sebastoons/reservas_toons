import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import './RatingsPage.css';

const RatingsPage = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [comment, setComment] = useState({});
    const [rating, setRating] = useState({});
    
    // ESTA ES LA CLAVE: Una variable simple que usaremos para "avisar" que hay que recargar
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        // 1. Definimos la función DENTRO del efecto. 
        // Al estar dentro, React ya no se queja de dependencias externas.
        const loadData = async () => {
            try {
                const res = await api.get('/appointments/');
                
                // Filtro: Solo mostrar citas Aceptadas/Completadas que NO tengan calificación
                const toRate = res.data.filter(app => 
                    (app.status === 'ACCEPTED' || app.status === 'COMPLETED') && app.rating === null
                );
                
                setPendingReviews(toRate);
            } catch {
                console.error("Error cargando revisiones");
            }
        };

        loadData();
    }, [reloadKey]); // 2. El efecto solo se ejecuta al inicio y cuando reloadKey cambia

    const handleSubmit = async (id) => {
        if (!rating[id]) return alert("Por favor selecciona las estrellas");
        
        try {
            await api.patch(`/appointments/${id}/rate/`, {
                rating: rating[id],
                feedback_comment: comment[id] || ''
            });
            alert("¡Gracias por tu evaluación!");
            
            // 3. ACTIVAMOS LA RECARGA: Cambiamos el valor de la llave para que el useEffect corra de nuevo
            setReloadKey(prev => prev + 1); 
        } catch {
            alert("Error al enviar calificación");
        }
    };

    return (
        <div className="ratings-container">
            <h2 style={{marginBottom: '20px'}}>Evalúa tu Visita</h2>
            
            {pendingReviews.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                    <p>No tienes visitas pendientes de evaluar.</p>
                </div>
            ) : (
                pendingReviews.map(item => (
                    <div key={item.id} className="rating-card">
                        <div className="rating-header">
                            <div>
                                <h3>{item.work_type}</h3>
                                <p style={{fontSize: '0.9rem', color: '#666'}}>{item.date}</p>
                            </div>
                            <div className="tech-info">
                                Técnico: {item.technician_detail?.first_name} {item.technician_detail?.last_name}
                            </div>
                        </div>

                        <div style={{textAlign: 'center', margin: '20px 0'}}>
                            <p style={{marginBottom: '10px'}}>¿Qué tan satisfecho estás con el servicio?</p>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <StarRating 
                                    rating={rating[item.id] || 0} 
                                    onRatingChange={(val) => setRating({...rating, [item.id]: val})} 
                                />
                            </div>
                        </div>

                        <textarea 
                            className="feedback-area"
                            placeholder="Escribe tus comentarios aquí para ayudarnos a mejorar..."
                            value={comment[item.id] || ''}
                            onChange={(e) => setComment({...comment, [item.id]: e.target.value})}
                        />

                        <button className="btn-rate" onClick={() => handleSubmit(item.id)}>
                            Enviar Calificación
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default RatingsPage;