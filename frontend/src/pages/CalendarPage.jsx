import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, X, Calendar as CalIcon, CheckSquare, Square } from 'lucide-react';
import './CalendarPage.css';

const CalendarPage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null); // Modal de Agenda del Día
    const [selectedEvent, setSelectedEvent] = useState(null); // Modal de Detalle de Servicio
    const [reloadKey, setReloadKey] = useState(0);
    
    // Estado para selección múltiple de horas
    const [selectedHours, setSelectedHours] = useState([]); 
    const [blockType, setBlockType] = useState('BLOQUEO');
    const [blockReason, setBlockReason] = useState('');

    // Diccionario de colores
    const STATUS_MAP = {
        'PENDING': '#ff9800',
        'ACCEPTED': '#2e7d32',
        'REJECTED': '#d32f2f',
        'COMPLETED': '#1565c0',
        'BLOQUEO': '#757575',
        'VACACIONES': '#9c27b0'
    };

    const WORK_HOURS = [
        "09:00", "10:00", "11:00", "12:00", "13:00", 
        "14:00", "15:00", "16:00", "17:00", "18:00"
    ];

    useEffect(() => {
        const loadData = async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('technician_id', user.id);
            if (!error) setAppointments(data);
        };
        loadData();
    }, [reloadKey, user.id]);

    // SOLUCIÓN 2: Función auxiliar para cerrar el modal y limpiar datos AL MISMO TIEMPO.
    // Esto elimina la necesidad del segundo useEffect que causaba el error en la línea 54.
    const handleCloseDayModal = () => {
        setSelectedDay(null);
        setSelectedHours([]); // Limpieza inmediata
        setBlockReason('');
    };

    // Lógica de Calendario
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let firstDayIndex = new Date(year, month, 1).getDay();
        firstDayIndex = (firstDayIndex === 0 ? 6 : firstDayIndex - 1); 

        const daysArray = [];
        for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
        for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(year, month, i));
        return daysArray;
    };

    const getEventsForDate = (dateObj) => {
        if (!dateObj) return [];
        const dateStr = dateObj.toISOString().split('T')[0];
        return appointments.filter(app => app.date === dateStr);
    };

    // --- MANEJO DE SELECCIÓN MÚLTIPLE ---
    const toggleHourSelection = (hour) => {
        if (selectedHours.includes(hour)) {
            setSelectedHours(selectedHours.filter(h => h !== hour));
        } else {
            setSelectedHours([...selectedHours, hour]);
        }
    };

    const handleSelectFullDay = () => {
        const dayEvents = getEventsForDate(selectedDay);
        const busyHours = dayEvents.map(ev => ev.time.substring(0, 5));
        const freeHours = WORK_HOURS.filter(h => !busyHours.some(bh => bh.startsWith(h)));
        
        if (selectedHours.length === freeHours.length) {
            setSelectedHours([]); 
        } else {
            setSelectedHours(freeHours); 
        }
    };

    const handleBulkBlockSubmit = async (e) => {
        e.preventDefault();
        if (selectedHours.length === 0 || !selectedDay) return;

        const dateStr = selectedDay.toISOString().split('T')[0];
        const rows = selectedHours.map(hour => ({
            coordinator_id: user.id,
            technician_id: user.id,
            client_name: blockType === 'VACACIONES' ? 'VACACIONES' : 'NO DISPONIBLE',
            work_type: blockType,
            date: dateStr,
            time: hour,
            duration_estimated: '1 Hora',
            address: 'Bloqueo de Agenda',
            client_email: 'interno@bloqueo.com',
            client_phone: '00000000',
            description: blockReason || (blockType === 'VACACIONES' ? 'Día libre' : 'No disponible'),
        }));

        const { error } = await supabase.from('appointments').insert(rows);
        if (error) {
            alert("Error al guardar los bloqueos. Verifica tu conexión.");
        } else {
            alert(`Se han bloqueado ${selectedHours.length} horas correctamente.`);
            handleCloseDayModal();
            setReloadKey(prev => prev + 1);
        }
    };

    const calendarDays = getDaysInMonth(currentDate);
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="calendar-container">
            {/* Sidebar */}
            <aside className="calendar-sidebar" style={{width: '260px'}}>
                <h3 className="sidebar-title">Mi Agenda</h3>
                <div style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>
                    <p>Gestiona tu disponibilidad seleccionando días y bloqueando horas o días completos.</p>
                </div>
                
                <div className="filter-group">
                    <h4 style={{fontSize:'0.85rem', marginBottom:'10px'}}>Referencias:</h4>
                    <div className="legend-item"><div className="dot" style={{background: STATUS_MAP.ACCEPTED}}></div> Servicios</div>
                    <div className="legend-item"><div className="dot" style={{background: STATUS_MAP.BLOQUEO}}></div> No Disponible</div>
                    <div className="legend-item"><div className="dot" style={{background: STATUS_MAP.VACACIONES}}></div> Vacaciones</div>
                </div>
            </aside>

            {/* Calendario */}
            <div className="calendar-main">
                <div className="calendar-header">
                    <h2 style={{textTransform: 'capitalize'}}>
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div style={{display: 'flex', gap: '5px'}}>
                        <button className="nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft size={20}/></button>
                        <button className="nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight size={20}/></button>
                    </div>
                </div>

                <div className="calendar-grid">
                    {weekDays.map(d => <div key={d} className="weekday-label">{d}</div>)}
                    
                    {calendarDays.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="calendar-day day-unavailable"></div>;
                        
                        const dayEvents = getEventsForDate(date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <div 
                                key={date.toISOString()} 
                                className={`calendar-day ${isWeekend ? 'day-unavailable' : ''}`}
                                onClick={() => setSelectedDay(date)}
                            >
                                <div className="day-header">
                                    <span>{date.getDate()}</span>
                                </div>
                                {dayEvents.map(ev => (
                                    <div 
                                        key={ev.id} 
                                        className="event-pill"
                                        style={{ backgroundColor: STATUS_MAP[ev.work_type] || STATUS_MAP[ev.status] || '#ccc' }}
                                    >
                                        {ev.time.substring(0,5)} {ev.work_type === 'BLOQUEO' ? 'Bloqueado' : ev.client_name}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL 1: AGENDA DEL DÍA */}
            {selectedDay && (
                <div className="modal-overlay" onClick={handleCloseDayModal}>
                    <div className="day-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{margin:0}}>
                                    {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <p style={{fontSize:'0.8rem', color:'#666', margin:0}}>Selecciona las horas para bloquear o ver detalles.</p>
                            </div>
                            <button onClick={handleCloseDayModal}><X size={20}/></button>
                        </div>

                        <div className="bulk-actions-header">
                            <button className="btn-small-outline" onClick={handleSelectFullDay}>
                                <CalIcon size={14}/> {selectedHours.length > 0 ? 'Deseleccionar todo' : 'Seleccionar Todo el Día'}
                            </button>
                        </div>

                        <div className="day-agenda">
                            {WORK_HOURS.map(hour => {
                                const eventAtHour = getEventsForDate(selectedDay).find(ev => ev.time.startsWith(hour));
                                const isSelected = selectedHours.includes(hour);

                                return (
                                    <div 
                                        key={hour} 
                                        className={`hour-slot ${isSelected ? 'slot-selected' : ''}`}
                                        onClick={() => !eventAtHour && toggleHourSelection(hour)}
                                    >
                                        <div className="hour-label">{hour}</div>
                                        
                                        <div className="hour-content">
                                            {eventAtHour ? (
                                                <div 
                                                    className="event-pill-large" 
                                                    style={{ 
                                                        backgroundColor: STATUS_MAP[eventAtHour.work_type] || STATUS_MAP[eventAtHour.status] 
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedEvent(eventAtHour); 
                                                    }}
                                                >
                                                    {eventAtHour.work_type === 'BLOQUEO' ? '⛔ No Disponible' : 
                                                     eventAtHour.work_type === 'VACACIONES' ? '🏖️ Vacaciones' : 
                                                     `🔧 ${eventAtHour.client_name} - ${eventAtHour.work_type}`}
                                                </div>
                                            ) : (
                                                <span style={{color: '#aaa', fontSize:'0.85rem'}}>Disponible</span>
                                            )}
                                        </div>

                                        {!eventAtHour && (
                                            <div className="hour-check">
                                                {isSelected ? <CheckSquare size={20} color="var(--primary-blue)"/> : <Square size={20} color="#ddd"/>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* PANEL DE ACCIÓN MASIVA */}
                        {selectedHours.length > 0 && (
                            <div className="bulk-action-panel">
                                <h4>Bloquear {selectedHours.length} horas seleccionadas:</h4>
                                <form onSubmit={handleBulkBlockSubmit}>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
                                        <select 
                                            className="form-control"
                                            value={blockType}
                                            onChange={e => setBlockType(e.target.value)}
                                        >
                                            <option value="BLOQUEO">No Disponible</option>
                                            <option value="VACACIONES">Vacaciones</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            placeholder="Motivo (Opcional)"
                                            value={blockReason}
                                            onChange={e => setBlockReason(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary full-width">Confirmar Bloqueo</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 2: DETALLES DEL SERVICIO */}
            {selectedEvent && (
                <div className="modal-overlay z-high" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalles del Servicio</h3>
                            <button onClick={() => setSelectedEvent(null)}><X size={20}/></button>
                        </div>
                        
                        <div className="modal-body-detail">
                            <p><strong>Cliente:</strong> {selectedEvent.client_name}</p>
                            <p><strong>Fecha:</strong> {selectedEvent.date} a las {selectedEvent.time}</p>
                            <p><strong>Dirección:</strong> {selectedEvent.address}</p>
                            <p><strong>Técnico:</strong> {selectedEvent.technician_detail?.first_name || 'Tú'}</p>
                            <p><strong>Estado:</strong> {selectedEvent.status}</p>
                            <hr/>
                            <p className="desc-box">{selectedEvent.description || "Sin descripción"}</p>
                        </div>
                        <div style={{textAlign:'right', marginTop:'15px'}}>
                            <button className="btn-close" onClick={() => setSelectedEvent(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;