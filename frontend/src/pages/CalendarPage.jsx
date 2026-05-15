import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, ArrowLeft, X } from 'lucide-react';
import './CalendarPage.css';

const WORK_HOURS = [
  "09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00"
];

const STATUS_COLOR = {
  PENDING: '#f59e0b', ACCEPTED: '#22c55e', REJECTED: '#ef4444',
  COMPLETED: '#3b82f6', BLOQUEO: '#6b7280', VACACIONES: '#a855f7'
};

const WORK_LABEL = {
  INST:'Instalación', MANT:'Mantención', DESINST:'Desinstalación',
  REPAR:'Reparación', BLOQUEO:'No Disponible', VACACIONES:'Vacaciones'
};

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // lunes=0
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function dateStr(d) { return d.toISOString().split('T')[0]; }

function initials(first, last) {
  return `${(first || '?')[0]}${(last || '')[0] || ''}`.toUpperCase();
}

// ─── VISTA: LISTA DE TÉCNICOS ──────────────────────────────────────────────
function TechList({ onSelect }) {
  const [techs, setTechs] = useState([]);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'TECH')
      .then(({ data }) => setTechs(data || []));
  }, []);

  return (
    <div className="tech-list-container">
      <h2 className="section-title">Selecciona un técnico</h2>
      <p className="section-sub">Elige un profesional para ver su disponibilidad</p>
      <div className="tech-cards">
        {techs.map(t => (
          <button key={t.id} className="tech-card" onClick={() => onSelect(t)}>
            <div className="tech-avatar">{initials(t.first_name, t.last_name)}</div>
            <div className="tech-info">
              <span className="tech-name">{t.first_name} {t.last_name}</span>
              <span className="tech-email">{t.email}</span>
            </div>
            <ChevronRight size={18} className="tech-arrow" />
          </button>
        ))}
        {techs.length === 0 && (
          <p style={{color:'var(--text-muted)', textAlign:'center', padding:'40px 0'}}>
            No hay técnicos registrados aún.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── VISTA: HORARIO DE UN TÉCNICO ─────────────────────────────────────────
function TechSchedule({ tech, onBack, isOwnSchedule }) {
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const week = getWeekDays(weekBase);

  const loadAppointments = useCallback(async () => {
    const from = dateStr(week[0]);
    const to   = dateStr(week[6]);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('technician_id', tech.id)
      .gte('date', from)
      .lte('date', to);
    setAppointments(data || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tech.id, weekBase]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const eventsForDay = (d) =>
    appointments.filter(a => a.date === dateStr(d));

  const eventAtHour = (d, hour) =>
    eventsForDay(d).find(a => a.time?.substring(0,5) === hour);

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); };

  const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const todayStr = dateStr(new Date());

  const morning = WORK_HOURS.filter(h => parseInt(h) < 13);
  const afternoon = WORK_HOURS.filter(h => parseInt(h) >= 13);

  return (
    <div className="schedule-container">
      {/* HEADER */}
      <div className="schedule-header">
        {onBack && (
          <button className="btn-back" onClick={onBack}>
            <ArrowLeft size={18}/> Técnicos
          </button>
        )}
        <div className="tech-header-info">
          <div className="tech-avatar sm">{initials(tech.first_name, tech.last_name)}</div>
          <div>
            <div className="tech-header-name">{tech.first_name} {tech.last_name}</div>
            <div className="tech-header-sub">{isOwnSchedule ? 'Tu agenda' : 'Horario del técnico'}</div>
          </div>
        </div>
      </div>

      {/* SEMANA DESLIZABLE */}
      <div className="week-nav">
        <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={18}/></button>
        <div className="week-days">
          {week.map((d, i) => {
            const ds = dateStr(d);
            const isSelected = ds === dateStr(selectedDay);
            const isToday = ds === todayStr;
            const hasEvents = eventsForDay(d).length > 0;
            return (
              <button
                key={ds}
                className={`week-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDay(d)}
              >
                <span className="wday-label">{DAY_NAMES[i]}</span>
                <span className="wday-num">{d.getDate()}</span>
                {hasEvents && <span className="wday-dot"/>}
              </button>
            );
          })}
        </div>
        <button className="nav-btn" onClick={nextWeek}><ChevronRight size={18}/></button>
      </div>

      {/* FECHA SELECCIONADA */}
      <div className="day-title">
        {selectedDay.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}
      </div>

      {/* SLOTS */}
      <div className="slots-section">
        <div className="slot-group-label">Mañana</div>
        <div className="slot-grid">
          {morning.map(hour => {
            const ev = eventAtHour(selectedDay, hour);
            return (
              <button
                key={hour}
                className={`slot-btn ${ev ? 'slot-occupied' : 'slot-free'}`}
                onClick={() => ev && setSelectedEvent(ev)}
                style={ev ? { borderColor: STATUS_COLOR[ev.work_type] || STATUS_COLOR[ev.status] } : {}}
              >
                <span className="slot-time">{hour}</span>
                {ev && <span className="slot-label">{WORK_LABEL[ev.work_type] || ev.client_name}</span>}
              </button>
            );
          })}
        </div>

        <div className="slot-group-label">Tarde</div>
        <div className="slot-grid">
          {afternoon.map(hour => {
            const ev = eventAtHour(selectedDay, hour);
            return (
              <button
                key={hour}
                className={`slot-btn ${ev ? 'slot-occupied' : 'slot-free'}`}
                onClick={() => ev && setSelectedEvent(ev)}
                style={ev ? { borderColor: STATUS_COLOR[ev.work_type] || STATUS_COLOR[ev.status] } : {}}
              >
                <span className="slot-time">{hour}</span>
                {ev && <span className="slot-label">{WORK_LABEL[ev.work_type] || ev.client_name}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle del servicio</h3>
              <button onClick={() => setSelectedEvent(null)}><X size={18}/></button>
            </div>
            <div className="modal-body-detail">
              <p><strong>Cliente:</strong> {selectedEvent.client_name}</p>
              <p><strong>Fecha:</strong> {selectedEvent.date} — {selectedEvent.time?.substring(0,5)}</p>
              <p><strong>Dirección:</strong> {selectedEvent.address}</p>
              <p><strong>Tipo:</strong> {WORK_LABEL[selectedEvent.work_type] || selectedEvent.work_type}</p>
              <p>
                <strong>Estado: </strong>
                <span style={{color: STATUS_COLOR[selectedEvent.status], fontWeight:700}}>
                  {selectedEvent.status}
                </span>
              </p>
              {selectedEvent.description && (
                <p className="desc-box">{selectedEvent.description}</p>
              )}
            </div>
            <div style={{textAlign:'right', marginTop:'16px'}}>
              <button className="btn-close" onClick={() => setSelectedEvent(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedTech, setSelectedTech] = useState(null);

  if (!user) return null;

  // TÉCNICO: ve su propio horario directo
  if (user.role === 'TECH') {
    return <TechSchedule tech={user} isOwnSchedule />;
  }

  // COORDINADOR / ADMIN: flujo lista → horario
  if (!selectedTech) {
    return <TechList onSelect={setSelectedTech} />;
  }

  return (
    <TechSchedule
      tech={selectedTech}
      onBack={() => setSelectedTech(null)}
    />
  );
}
