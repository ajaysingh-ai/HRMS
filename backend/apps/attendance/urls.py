from django.urls import path
from .views import (
    AttendanceListView,
    AttendanceDetailView,
    EmployeeAttendanceSummaryView,
    BulkAttendanceView,
)

urlpatterns = [
    path('attendance/', AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/bulk/', BulkAttendanceView.as_view(), name='attendance-bulk'),
    path('attendance/summary/<str:employee_id>/', EmployeeAttendanceSummaryView.as_view(), name='attendance-summary'),
    path('attendance/<str:employee_id>/<str:date_str>/', AttendanceDetailView.as_view(), name='attendance-detail'),
]
