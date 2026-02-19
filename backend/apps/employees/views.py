"""
Employee API Views for HRMS Lite.
Handles CRUD operations for employees using pymongo directly.
"""

from datetime import datetime, timezone
from bson import ObjectId
import pymongo.errors

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from hrms_project.db import get_db
from .validators import validate_employee_data, DEPARTMENTS


def serialize_employee(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    return {
        'id': str(doc['_id']),
        'employee_id': doc['employee_id'],
        'full_name': doc['full_name'],
        'email': doc['email'],
        'department': doc['department'],
        'created_at': doc.get('created_at', '').isoformat() if doc.get('created_at') else None,
    }


class EmployeeListView(APIView):
    """
    GET  /api/employees/         - List all employees
    POST /api/employees/         - Create a new employee
    """

    def get(self, request):
        db = get_db()
        search = request.query_params.get('search', '').strip()
        department = request.query_params.get('department', '').strip()

        query = {}
        if search:
            query['$or'] = [
                {'full_name': {'$regex': search, '$options': 'i'}},
                {'employee_id': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
            ]
        if department:
            query['department'] = department

        employees = list(db.employees.find(query).sort('created_at', -1))
        total = db.employees.count_documents({})

        return Response({
            'success': True,
            'data': [serialize_employee(e) for e in employees],
            'total': total,
            'filtered': len(employees),
        })

    def post(self, request):
        cleaned, errors = validate_employee_data(request.data)
        if errors:
            return Response(
                {'success': False, 'error': 'Validation failed.', 'fields': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        db = get_db()
        try:
            doc = {
                **cleaned,
                'created_at': datetime.now(timezone.utc),
            }
            result = db.employees.insert_one(doc)
            doc['_id'] = result.inserted_id

            return Response(
                {'success': True, 'data': serialize_employee(doc), 'message': 'Employee created successfully.'},
                status=status.HTTP_201_CREATED
            )
        except pymongo.errors.DuplicateKeyError as e:
            key_value = e.details.get('keyValue', {})
            if 'employee_id' in key_value:
                msg = f"Employee ID '{cleaned.get('employee_id')}' is already taken."
            elif 'email' in key_value:
                msg = f"Email '{cleaned.get('email')}' is already registered."
            else:
                msg = "A duplicate record already exists."
            return Response(
                {'success': False, 'error': msg},
                status=status.HTTP_409_CONFLICT
            )


class EmployeeDetailView(APIView):
    """
    GET    /api/employees/<employee_id>/   - Get employee details
    DELETE /api/employees/<employee_id>/   - Delete employee
    """

    def _get_employee(self, db, employee_id):
        return db.employees.find_one({'employee_id': employee_id})

    def get(self, request, employee_id):
        db = get_db()
        employee = self._get_employee(db, employee_id)
        if not employee:
            return Response(
                {'success': False, 'error': f"Employee '{employee_id}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_employee(employee)})

    def delete(self, request, employee_id):
        db = get_db()
        employee = self._get_employee(db, employee_id)
        if not employee:
            return Response(
                {'success': False, 'error': f"Employee '{employee_id}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        db.employees.delete_one({'employee_id': employee_id})
        # Also delete all attendance records for this employee
        deleted_attendance = db.attendance.delete_many({'employee_id': employee_id})

        return Response({
            'success': True,
            'message': f"Employee '{employee_id}' and {deleted_attendance.deleted_count} attendance record(s) deleted.",
        })


class DepartmentListView(APIView):
    """GET /api/departments/ - List available departments"""

    def get(self, request):
        return Response({'success': True, 'data': DEPARTMENTS})


class DashboardView(APIView):
    """GET /api/dashboard/ - Summary statistics"""

    def get(self, request):
        db = get_db()
        total_employees = db.employees.count_documents({})

        # Department breakdown
        pipeline = [
            {'$group': {'_id': '$department', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        dept_breakdown = [
            {'department': d['_id'], 'count': d['count']}
            for d in db.employees.aggregate(pipeline)
        ]

        # Attendance stats for today
        from datetime import date
        today_str = date.today().isoformat()
        today_present = db.attendance.count_documents({'date': today_str, 'status': 'Present'})
        today_absent = db.attendance.count_documents({'date': today_str, 'status': 'Absent'})

        # Total attendance records
        total_attendance = db.attendance.count_documents({})

        return Response({
            'success': True,
            'data': {
                'total_employees': total_employees,
                'department_breakdown': dept_breakdown,
                'today': {
                    'date': today_str,
                    'present': today_present,
                    'absent': today_absent,
                    'not_marked': max(0, total_employees - today_present - today_absent),
                },
                'total_attendance_records': total_attendance,
            }
        })
