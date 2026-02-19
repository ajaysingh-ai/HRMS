"""
Custom exception handler for DRF to provide consistent error responses.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import pymongo.errors


def custom_exception_handler(exc, context):
    """
    Returns a consistent error response format:
    {
        "success": false,
        "error": "Error message",
        "details": { ... }  # Optional
    }
    """
    # Handle pymongo duplicate key errors
    if isinstance(exc, pymongo.errors.DuplicateKeyError):
        key_value = exc.details.get('keyValue', {})
        if 'employee_id' in key_value:
            message = f"Employee with ID '{key_value['employee_id']}' already exists."
        elif 'email' in key_value:
            message = f"Employee with email '{key_value['email']}' already exists."
        else:
            message = "A duplicate record already exists."
        return Response(
            {'success': False, 'error': message},
            status=status.HTTP_409_CONFLICT
        )

    # Handle pymongo connection errors
    if isinstance(exc, pymongo.errors.ConnectionFailure):
        return Response(
            {'success': False, 'error': 'Database connection failed. Please try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Call DRF's default exception handler
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'success': False,
            'error': _extract_error_message(response.data),
        }

    return response


def _extract_error_message(data):
    """Extract a readable error message from DRF error data."""
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return ' '.join(str(e) for e in data)
    if isinstance(data, dict):
        messages = []
        for key, value in data.items():
            if key == 'detail':
                messages.append(str(value))
            elif isinstance(value, list):
                messages.append(f"{key}: {' '.join(str(v) for v in value)}")
            else:
                messages.append(f"{key}: {value}")
        return ' | '.join(messages)
    return str(data)
