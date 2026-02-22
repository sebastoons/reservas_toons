from rest_framework import serializers
from .models import Appointment
from users.serializers import UserSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    # Esto permite ver los detalles del técnico y coordinador en lugar de solo su ID
    technician_detail = UserSerializer(source='technician', read_only=True)
    coordinator_detail = UserSerializer(source='coordinator', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        # El coordinador se asignará automáticamente en la vista
        read_only_fields = ['coordinator', 'status', 'rating', 'feedback_comment']

class AppointmentStatusSerializer(serializers.ModelSerializer):
    """Serializer específico para que el técnico acepte o rechace."""
    class Meta:
        model = Appointment
        fields = ['status', 'technician_message']

class AppointmentRatingSerializer(serializers.ModelSerializer):
    """Serializer específico para la evaluación final."""
    class Meta:
        model = Appointment
        fields = ['rating', 'feedback_comment']