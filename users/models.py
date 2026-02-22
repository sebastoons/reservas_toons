from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Roles definidos
    ROLE_CHOICES = (
        ('ADMIN', 'Administrador'),
        ('COORD', 'Coordinador'), # El cliente externo que asigna
        ('TECH', 'Técnico'),      # El empleado que recibe trabajo
    )
    
    email = models.EmailField(unique=True) # Usaremos email para login
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='COORD')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Campos obligatorios para personalizar el login con email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"