"""
Attendance API Views for HRMS Lite.
Handles marking and viewing attendance records.
"""

from datetime import datetime, timezone, date
import re

import pymongo.errors

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from hrms_project.db import get_db

DATE_REGEX = re.compile(r'^\d{4}-\d{2}-\d{2}$')
VALID_STATUSES = ('Present', 'Absent')


def validate_attendance_data(data):
    errors = {}
    cleaned = {}

    employee_id = data.get('employee_id', '').strip()
    if not employee_id:
        errors['employee_id'] = 'Employee ID is required.'
    else:
        cleaned['employee_id'] = employee_id.upper()

    date_str = data.get('date', '').strip()
    if not date_str:
        errors['date'] = 'Date is required.'
    elif not DATE_REGEX.match(date_str):
        errors['date'] = 'Date must be in YYYY-MM-DD format.'
    else:
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            cleaned['date'] = date_str
        except ValueError:
            errors['date'] = 'Invalid date value.'

    att_status = data.get('status', '').strip()
    if not att_status:
        errors['status'] = 'Status is required.'
    elif att_status not in VALID_STATUSES:
        errors['status'] = f"Status must be one of: {', '.join(VALID_STATUSES)}."
    else:
        cleaned['status'] = att_status

    return cleaned, errors


def serialize_attendance(doc):
    return {
        'id': str(doc['_id']),
        'employee_id': doc['employee_id'],
        'employee_name': doc.get('employee_name', ''),
        'date': doc['date'],
        'status': doc['status'],
        'marked_at': doc.get('marked_at', '').isoformat() if doc.get('marked_at') else None,
    }


class AttendanceListView(APIView):
    """
    GET  /api/attendance/   - List attendance records (filterable)
    POST /api/attendance/   - Mark attendance
    """

    def get(self, request):
        db = get_db()
        query = {}

        employee_id = request.query_params.get('employee_id', '').strip()
        if employee_id:
            query['employee_id'] = employee_id.upper()

        date_filter = request.query_params.get('date', '').strip()
        if date_filter:
            query['date'] = date_filter

        month = request.query_params.get('month', '').strip()  # Format: YYYY-MM
        if month:
            query['date'] = {'$regex': f'^{month}'}

        records = list(db.attendance.find(query).sort('date', -1))

        return Response({
            'success': True,
            'data': [serialize_attendance(r) for r in records],
            'total': len(records),
        })

    def post(self, request):
        cleaned, errors = validate_attendance_data(request.data)
        if errors:
            return Response(
                {'success': False, 'error': 'Validation failed.', 'fields': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        db = get_db()

        # Verify employee exists
        employee = db.employees.find_one({'employee_id': cleaned['employee_id']})
        if not employee:
            return Response(
                {'success': False, 'error': f"Employee '{cleaned['employee_id']}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            doc = {
                **cleaned,
                'employee_name': employee['full_name'],
                'marked_at': datetime.now(timezone.utc),
            }
            result = db.attendance.insert_one(doc)
            doc['_id'] = result.inserted_id

            return Response(
                {'success': True, 'data': serialize_attendance(doc), 'message': 'Attendance marked successfully.'},
                status=status.HTTP_201_CREATED
            )
        except pymongo.errors.DuplicateKeyError:
            return Response(
                {
                    'success': False,
                    'error': f"Attendance already marked for employee '{cleaned['employee_id']}' on {cleaned['date']}. Use update to change it."
                },
                status=status.HTTP_409_CONFLICT
            )


class AttendanceDetailView(APIView):
    """
    PUT    /api/attendance/<employee_id>/<date>/  - Update attendance
    DELETE /api/attendance/<employee_id>/<date>/  - Delete attendance record
    """

    def put(self, request, employee_id, date_str):
        db = get_db()
        att_status = request.data.get('status', '').strip()
        if att_status not in VALID_STATUSES:
            return Response(
                {'success': False, 'error': f"Status must be one of: {', '.join(VALID_STATUSES)}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = db.attendance.find_one_and_update(
            {'employee_id': employee_id.upper(), 'date': date_str},
            {'$set': {'status': att_status, 'marked_at': datetime.now(timezone.utc)}},
            return_document=True
        )

        if not result:
            return Response(
                {'success': False, 'error': 'Attendance record not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({'success': True, 'data': serialize_attendance(result), 'message': 'Attendance updated.'})

    def delete(self, request, employee_id, date_str):
        db = get_db()
        result = db.attendance.delete_one({'employee_id': employee_id.upper(), 'date': date_str})
        if result.deleted_count == 0:
            return Response(
                {'success': False, 'error': 'Attendance record not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'message': 'Attendance record deleted.'})


class EmployeeAttendanceSummaryView(APIView):
    """
    GET /api/attendance/summary/<employee_id>/
    Returns total present/absent days and per-month breakdown.
    """

    def get(self, request, employee_id):
        db = get_db()

        employee = db.employees.find_one({'employee_id': employee_id.upper()})
        if not employee:
            return Response(
                {'success': False, 'error': f"Employee '{employee_id}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        records = list(db.attendance.find({'employee_id': employee_id.upper()}).sort('date', -1))

        total_present = sum(1 for r in records if r['status'] == 'Present')
        total_absent = sum(1 for r in records if r['status'] == 'Absent')

        # Monthly breakdown
        monthly = {}
        for r in records:
            month = r['date'][:7]  # YYYY-MM
            if month not in monthly:
                monthly[month] = {'present': 0, 'absent': 0}
            if r['status'] == 'Present':
                monthly[month]['present'] += 1
            else:
                monthly[month]['absent'] += 1

        return Response({
            'success': True,
            'data': {
                'employee_id': employee_id.upper(),
                'employee_name': employee['full_name'],
                'total_present': total_present,
                'total_absent': total_absent,
                'total_records': len(records),
                'attendance_rate': round(total_present / len(records) * 100, 1) if records else 0,
                'monthly_breakdown': [
                    {'month': k, **v} for k, v in sorted(monthly.items(), reverse=True)
                ],
                'recent_records': [serialize_attendance(r) for r in records[:10]],
            }
        })


class BulkAttendanceView(APIView):
    """
    POST /api/attendance/bulk/
    Mark attendance for multiple employees at once.
    """

    def post(self, request):
        db = get_db()
        records = request.data.get('records', [])
        date_str = request.data.get('date', '')

        if not records:
            return Response(
                {'success': False, 'error': 'No records provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not date_str or not DATE_REGEX.match(date_str):
            return Response(
                {'success': False, 'error': 'Valid date is required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = {'created': 0, 'updated': 0, 'errors': []}

        for record in records:
            employee_id = str(record.get('employee_id', '')).upper()
            att_status = record.get('status', '')

            if att_status not in VALID_STATUSES:
                results['errors'].append({'employee_id': employee_id, 'error': 'Invalid status.'})
                continue

            employee = db.employees.find_one({'employee_id': employee_id})
            if not employee:
                results['errors'].append({'employee_id': employee_id, 'error': 'Employee not found.'})
                continue

            existing = db.attendance.find_one({'employee_id': employee_id, 'date': date_str})
            if existing:
                db.attendance.update_one(
                    {'employee_id': employee_id, 'date': date_str},
                    {'$set': {'status': att_status, 'marked_at': datetime.now(timezone.utc)}}
                )
                results['updated'] += 1
            else:
                db.attendance.insert_one({
                    'employee_id': employee_id,
                    'employee_name': employee['full_name'],
                    'date': date_str,
                    'status': att_status,
                    'marked_at': datetime.now(timezone.utc),
                })
                results['created'] += 1

        return Response({'success': True, 'data': results})
