from django.urls import path
from .views import EmployeeListView, EmployeeDetailView, DepartmentListView, DashboardView

urlpatterns = [
    path('employees/', EmployeeListView.as_view(), name='employee-list'),
    path('employees/<str:employee_id>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
