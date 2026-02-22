from django.db import models
from django.conf import settings

class Appointment(models.Model):
    # Estados de la reserva según tus mockups
    STATUS_CHOICES = (
        ('PENDING', 'En espera'),
        ('ACCEPTED', 'Aceptado'),
        ('REJECTED', 'Rechazado'),
        ('COMPLETED', 'Completado'),
    )

    # Tipos de trabajo del formulario
    WORK_TYPES = (
        ('INST', 'Instalación'),
        ('MANT', 'Mantención'),
        ('DESINST', 'Desinstalación'),
        ('REPAR', 'Reparación'),
        ('BLOQUEO', 'No Disponible / Bloqueado'),
        ('VACACIONES', 'Vacaciones'),
    )

    # Relaciones
    # El coordinador que crea la reserva (Usuario con rol COORD)
    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_appointments'
    )
    # El técnico que realizará el trabajo (Usuario con rol TECH)
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assigned_tasks'
    )

    # Datos del Cliente y Ubicación
    client_name = models.CharField(max_length=255) # Empresa X S.A.
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=20)
    address = models.TextField() # Calle Falsa 123
    
    # Detalles del Trabajo
    work_type = models.CharField(max_length=10, choices=WORK_TYPES, default='INST')
    description = models.TextField() # "Instalación de nuevo sistema..."
    assigned_by_name = models.CharField(max_length=100) # Nombre de quien asignó
    
    # Fecha y Horario
    date = models.DateField()
    time = models.TimeField()
    duration_estimated = models.CharField(max_length=50, default="1 Hora 30 Minutos")

    # Estado y Respuesta del Técnico
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    technician_message = models.TextField(blank=True, null=True) # Mensaje opcional al aceptar/rechazar

    # Evaluación y Feedback (Fase final)
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)], blank=True, null=True)
    feedback_comment = models.TextField(blank=True, null=True)
    evaluation_date = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.client_name} - {self.date} ({self.get_status_display()})"