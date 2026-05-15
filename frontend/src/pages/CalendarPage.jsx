import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, ArrowLeft, X } from 'lucide-react';
import './CalendarPage.css';

// 08:00 → 20:00
const MORNING   = ["08:00","09:00","10:00","11:00"];
const AFTERNOON = ["12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const ALL_HOURS = [...MORNING, ...AFTERNOON];

const DAY_NAMES  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const BLOCK_TYPES = ['BLOQUEO','VACACIONES'];

const WORK_LABEL = {
  INST:'Instalación', MANT:'Mantención', DESINST:'Desinstalación',
  REPAR:'Reparación', BLOQUEO:'No disponible', VACACIONES:'Vacaciones'
};
const STATUS_COLOR = {
  PENDING:'#f59e0b', ACCEPTED:'#22c55e', REJECTED:'#ef4444',
  COMPLETED:'#3b82f6', BLOQUEO:'#475569', VACACIONES:'#7c3aed'
};

function dateStr(d) { return d.toISOString().split('T')[0]; }
function initials(f='', l='') { return `${f[0]||'?'}${l[0]||''}`.toUpperCase(); }

function getWeekDays(base) {
  const d = new Date(base);
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d); dd.setDate(d.getDate() + i); return dd;
  });
}

/* ─── LISTA DE TÉCNICOS ─────────────────────────────────────── */
function TechList({ onSelect }) {
  const [techs, setTechs] = useState([]);
  useEffect(() => {
    supabase.from('profiles').select('*').eq('role','TECH')
      .then(({ data }) => setTechs(data || []));
  }, []);

  return (
    <div className="tech-list-container">
      <h2 className="section-title">Técnicos disponibles</h2>
      <p className="section-sub">Selecciona un técnico para ver su agenda</p>
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
          <p className="empty-msg">No hay técnicos registrados aún.</p>
        )}
      </div>
    </div>
  );
}

/* ─── HORARIO DEL TÉCNICO ───────────────────────────────────── */
function TechSchedule({ tech, onBack, canEdit }) {
  const { user } = useAuth();
  const [weekBase, setWeekBase]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal]           = useState(null); // { type:'detail'|'block'|'unblock', event?, hour? }
  const [loading, setLoading]       = useState(false);

  const week = getWeekDays(weekBase);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('appointments').select('*')
      .eq('technician_id', tech.id)
      .gte('date', dateStr(week[0]))
      .lte('date', dateStr(week[6]));
    setAppointments(data || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tech.id, weekBase]);

  useEffect(() => { load(); }, [load]);

  const evForDay = (d) => appointments.filter(a => a.date === dateStr(d));

  const evAtHour = (d, h) =>
    evForDay(d).find(a => a.time?.substring(0,5) === h);

  const prevWeek = () => { const d=new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); };
  const nextWeek = () => { const d=new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); };

  const todayStr = dateStr(new Date());

  // Marcar no disponible
  const markUnavailable = async (hour) => {
    setLoading(true);
    await supabase.from('appointments').insert({
      coordinator_id: user.id,
      technician_id:  tech.id,
      work_type:      'BLOQUEO',
      date:           dateStr(selectedDay),
      time:           hour,
      client_name:    'NO DISPONIBLE',
      client_email:   'bloq@interno.com',
      client_phone:   '000',
      address:        'Bloqueo de agenda',
      description:    'No disponible',
      duration_estimated: '1 Hora',
    });
    setModal(null);
    setLoading(false);
    load();
  };

  // Quitar bloqueo
  const unmarkUnavailable = async (id) => {
    setLoading(true);
    await supabase.from('appointments').delete().eq('id', id);
    setModal(null);
    setLoading(false);
    load();
  };

  const handleSlotClick = (hour) => {
    const ev = evAtHour(selectedDay, hour);
    if (!ev) {
      if (canEdit) setModal({ type: 'block', hour });
      return;
    }
    if (BLOCK_TYPES.includes(ev.work_type)) {
      if (canEdit) setModal({ type: 'unblock', event: ev });
      return;
    }
    setModal({ type: 'detail', event: ev });
  };

  const renderSlot = (hour) => {
    const ev = evAtHour(selectedDay, hour);
    const isBlock = ev && BLOCK_TYPES.includes(ev.work_type);

    // Coordinador público: ocultar slots bloqueados
    if (!canEdit && isBlock) return null;

    // Si no hay event: slot libre
    if (!ev) {
      return (
        <button key={hour} className="slot-btn slot-free"
          onClick={() => handleSlotClick(hour)}>
          <span className="slot-time">{hour}</span>
          {canEdit && <span className="slot-hint">Disponible</span>}
        </button>
      );
    }

    // Slot bloqueado (dimmed)
    if (isBlock) {
      return (
        <button key={hour} className={`slot-btn slot-blocked ${canEdit?'slot-editable':''}`}
          onClick={() => handleSlotClick(hour)}>
          <span className="slot-time">{hour}</span>
          <span className="slot-label">No disponible</span>
        </button>
      );
    }

    // Slot ocupado (appointment real)
    return (
      <button key={hour} className="slot-btn slot-occupied"
        style={{ borderColor: STATUS_COLOR[ev.status] || STATUS_COLOR[ev.work_type] }}
        onClick={() => handleSlotClick(hour)}>
        <span className="slot-time">{hour}</span>
        <span className="slot-label">{WORK_LABEL[ev.work_type] || ev.client_name}</span>
      </button>
    );
  };

  const morningSlots   = MORNING.map(renderSlot).filter(Boolean);
  const afternoonSlots = AFTERNOON.map(renderSlot).filter(Boolean);

  return (
    <div className="schedule-container">
      {/* HEADER */}
      <div className="schedule-header">
        {onBack && (
          <button className="btn-back" onClick={onBack}>
            <ArrowLeft size={16}/> Técnicos
          </button>
        )}
        <div className="tech-header-info">
          <div className="tech-avatar sm">{initials(tech.first_name, tech.last_name)}</div>
          <div>
            <div className="tech-header-name">{tech.first_name} {tech.last_name}</div>
            <div className="tech-header-sub">
              {canEdit ? 'Gestiona tu disponibilidad' : 'Horario disponible'}
            </div>
          </div>
        </div>
      </div>

      {/* SEMANA */}
      <div className="week-nav">
        <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={16}/></button>
        <div className="week-days">
          {week.map((d, i) => {
            const ds = dateStr(d);
            const isSelected = ds === dateStr(selectedDay);
            const isToday    = ds === todayStr;
            const dots = evForDay(d).filter(a =>
              canEdit ? !BLOCK_TYPES.includes(a.work_type) : !BLOCK_TYPES.includes(a.work_type)
            ).length;
            return (
              <button key={ds}
                className={`week-day-btn${isSelected?' selected':''}${isToday?' today':''}`}
                onClick={() => setSelectedDay(d)}>
                <span className="wday-label">{DAY_NAMES[i]}</span>
                <span className="wday-num">{d.getDate()}</span>
                {dots > 0 && <span className="wday-dot"/>}
              </button>
            );
          })}
        </div>
        <button className="nav-btn" onClick={nextWeek}><ChevronRight size={16}/></button>
      </div>

      {/* FECHA */}
      <div className="day-title">
        {selectedDay.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
      </div>

      {/* SLOTS */}
      <div className="slots-section">
        {morningSlots.length > 0 && (
          <>
            <div className="slot-group-label">Mañana</div>
            <div className="slot-grid">{morningSlots}</div>
          </>
        )}
        {afternoonSlots.length > 0 && (
          <>
            <div className="slot-group-label">Tarde</div>
            <div className="slot-grid">{afternoonSlots}</div>
          </>
        )}
        {morningSlots.length === 0 && afternoonSlots.length === 0 && (
          <p className="empty-msg">No hay horarios disponibles este día.</p>
        )}
      </div>

      {/* ── MODALES ─────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>

            {/* DETALLE CITA */}
            {modal.type === 'detail' && (
              <>
                <div className="modal-header">
                  <h3>Detalle del servicio</h3>
                  <button onClick={() => setModal(null)}><X size={16}/></button>
                </div>
                <div className="modal-body-detail">
                  <p><strong>Cliente:</strong> {modal.event.client_name}</p>
                  <p><strong>Fecha:</strong> {modal.event.date} — {modal.event.time?.substring(0,5)}</p>
                  <p><strong>Dirección:</strong> {modal.event.address}</p>
                  <p><strong>Tipo:</strong> {WORK_LABEL[modal.event.work_type]||modal.event.work_type}</p>
                  <p><strong>Estado: </strong>
                    <span style={{color:STATUS_COLOR[modal.event.status],fontWeight:700}}>
                      {modal.event.status}
                    </span>
                  </p>
                  {modal.event.description && <p className="desc-box">{modal.event.description}</p>}
                </div>
                <div style={{textAlign:'right',marginTop:'16px'}}>
                  <button className="btn-close" onClick={() => setModal(null)}>Cerrar</button>
                </div>
              </>
            )}

            {/* MARCAR NO DISPONIBLE */}
            {modal.type === 'block' && (
              <>
                <div className="modal-header">
                  <h3>Marcar no disponible</h3>
                  <button onClick={() => setModal(null)}><X size={16}/></button>
                </div>
                <p className="modal-desc">
                  ¿Marcar el horario de las <strong>{modal.hour}</strong> como no disponible?
                </p>
                <div className="modal-actions">
                  <button className="btn-close" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn-confirm-block" onClick={() => markUnavailable(modal.hour)} disabled={loading}>
                    {loading ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}

            {/* QUITAR BLOQUEO */}
            {modal.type === 'unblock' && (
              <>
                <div className="modal-header">
                  <h3>Horario bloqueado</h3>
                  <button onClick={() => setModal(null)}><X size={16}/></button>
                </div>
                <p className="modal-desc">
                  Las <strong>{modal.event.time?.substring(0,5)}</strong> están marcadas como no disponible.
                  ¿Habilitar este horario?
                </p>
                <div className="modal-actions">
                  <button className="btn-close" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn-confirm-unblock" onClick={() => unmarkUnavailable(modal.event.id)} disabled={loading}>
                    {loading ? 'Guardando...' : 'Habilitar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ──────────────────────────────────── */
export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedTech, setSelectedTech] = useState(null);

  // TÉCNICO: directo a su propia agenda (puede editar)
  if (user?.role === 'TECH') {
    return <TechSchedule tech={user} canEdit />;
  }

  // ADMIN: lista de técnicos, puede editar cualquiera
  if (user?.role === 'ADMIN') {
    if (!selectedTech) return <TechList onSelect={setSelectedTech} />;
    return <TechSchedule tech={selectedTech} onBack={() => setSelectedTech(null)} canEdit />;
  }

  // PÚBLICO (coordinador sin login): lista → horario solo lectura
  if (!selectedTech) return <TechList onSelect={setSelectedTech} />;
  return <TechSchedule tech={selectedTech} onBack={() => setSelectedTech(null)} canEdit={false} />;
}
