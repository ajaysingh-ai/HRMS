from django.urls import path, include

urlpatterns = [
    path('api/', include('apps.employees.urls')),
    path('api/', include('apps.attendance.urls')),
]
