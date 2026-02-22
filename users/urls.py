# En users/urls.py

from django.urls import path
from .views import RegisterView, MeView, TechnicianListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('technicians/', TechnicianListView.as_view(), name='technicians'), # <--- Nueva ruta
]