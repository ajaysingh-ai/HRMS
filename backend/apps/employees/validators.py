"""
Validation utilities for employee data.
"""

import re
from datetime import datetime

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

DEPARTMENTS = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Finance',
    'Human Resources',
    'Operations',
    'Legal',
    'Customer Support',
]


def validate_employee_data(data, is_update=False):
    """
    Validate employee creation/update data.
    Returns (cleaned_data, errors) tuple.
    errors is a dict of field -> error message, or empty dict if valid.
    """
    errors = {}
    cleaned = {}

    # employee_id
    employee_id = data.get('employee_id', '').strip()
    if not is_update:
        if not employee_id:
            errors['employee_id'] = 'Employee ID is required.'
        elif len(employee_id) < 2 or len(employee_id) > 20:
            errors['employee_id'] = 'Employee ID must be between 2 and 20 characters.'
        else:
            cleaned['employee_id'] = employee_id.upper()

    # full_name
    full_name = data.get('full_name', '').strip()
    if not full_name:
        errors['full_name'] = 'Full name is required.'
    elif len(full_name) < 2 or len(full_name) > 100:
        errors['full_name'] = 'Full name must be between 2 and 100 characters.'
    else:
        cleaned['full_name'] = full_name

    # email
    email = data.get('email', '').strip().lower()
    if not email:
        errors['email'] = 'Email address is required.'
    elif not EMAIL_REGEX.match(email):
        errors['email'] = 'Please provide a valid email address.'
    else:
        cleaned['email'] = email

    # department
    department = data.get('department', '').strip()
    if not department:
        errors['department'] = 'Department is required.'
    else:
        cleaned['department'] = department

    return cleaned, errors
