from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('client_name', 'technician', 'date', 'time', 'status', 'rating')
    list_filter = ('status', 'date', 'technician')
    search_fields = ('client_name', 'address')