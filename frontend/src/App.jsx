import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import CalendarPage from './pages/CalendarPage';
import ReservationForm from './pages/ReservationForm';
import MyAssignments from './pages/MyAssignments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas con el diseño principal (Header azul) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<CalendarPage />} />
          <Route path="/asignaciones" element={<MyAssignments />} /> 
          <Route path="/reservaciones" element={<ReservationForm />} />
          {/* Hemos comentado/eliminado temporalmente la ruta de Calificaciones */}
        </Route>

        {/* Cualquier ruta desconocida manda al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;