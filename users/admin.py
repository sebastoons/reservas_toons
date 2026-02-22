# En users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Columnas que se verán en la lista de usuarios
    list_display = ('email', 'username', 'role', 'first_name', 'last_name', 'is_staff')
    
    # Filtros laterales (para buscar rápido solo Técnicos, por ejemplo)
    list_filter = ('role', 'is_staff', 'is_active')
    
    # Campos por los que puedes buscar en la barra de búsqueda
    search_fields = ('email', 'username', 'first_name', 'last_name')
    
    # Ordenar por email por defecto
    ordering = ('email',)

    # Esto agrega los campos 'role' y 'phone' al formulario de edición del admin
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('role', 'phone')}),
    )
    
    # Esto agrega los campos al formulario de "Agregar Usuario"
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'role', 'phone')}
        ),
    )

# Registramos el modelo
admin.site.register(User, CustomUserAdmin)
