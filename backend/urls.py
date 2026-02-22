from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import RegisterView, MeView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Autenticación (Login devuelve Access y Refresh Token)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Usuarios
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', MeView.as_view(), name='me'),

    path('api/users/', include('users.urls')), # Si creaste users/urls.py
    path('api/appointments/', include('appointments.urls')), # <--- Nueva línea
]