from django.urls import path
from .views import (
    AppointmentListCreateView, 
    AppointmentDetailView, 
    UpdateAppointmentStatusView,
    RateAppointmentView 
)

urlpatterns = [
    path('', AppointmentListCreateView.as_view(), name='appointment-list'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('<int:pk>/status/', UpdateAppointmentStatusView.as_view(), name='appointment-status'),
    path('<int:pk>/rate/', RateAppointmentView.as_view(), name='appointment-rate'),
]