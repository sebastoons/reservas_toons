from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Appointment
from .serializers import (
    AppointmentSerializer, 
    AppointmentStatusSerializer, 
    AppointmentRatingSerializer
)

class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Appointment.objects.all()
        elif user.role == 'TECH':
            return Appointment.objects.filter(technician=user)
        return Appointment.objects.filter(coordinator=user)

    def perform_create(self, serializer):
        # Asigna automáticamente al usuario logueado como el coordinador que crea la cita
        serializer.save(coordinator=self.request.user)

class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class UpdateAppointmentStatusView(generics.UpdateAPIView):
    """Vista para que el técnico acepte/rechace el trabajo."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        appointment = self.get_object()
        # Seguridad: Solo el técnico asignado puede cambiar el estado
        if appointment.technician != request.user:
            return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FOR_PERMISSION)
        return super().patch(request, *args, **kwargs)
    
class RateAppointmentView(generics.UpdateAPIView):
    """Permite al Coordinador calificar el servicio."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        appointment = self.get_object()
        
        # 1. Seguridad: Solo el dueño de la cita puede calificar
        if appointment.coordinator != request.user:
            return Response({"error": "No tienes permiso para calificar esta cita"}, status=status.HTTP_403_FORBIDDEN)
        
        # 2. Lógica: Solo se pueden calificar citas ya realizadas (Aceptadas o Completadas)
        if appointment.status not in ['ACCEPTED', 'COMPLETED']:
            return Response({"error": "Solo puedes calificar trabajos terminados o aceptados"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Guardar cambios y marcar como COMPLETADA si no lo estaba
        response = super().patch(request, *args, **kwargs)
        if response.status_code == 200:
            appointment.status = 'COMPLETED'
            appointment.save()
            
        return response