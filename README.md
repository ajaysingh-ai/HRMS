# HRMS Lite — Human Resource Management System

A lightweight, production-ready HRMS web application built with **React** (frontend) and **Django + MongoDB** (backend).

---

## Features

- **Employee Management**: Add, view, search, filter, and delete employees
- **Attendance Tracking**: Mark daily attendance (Present/Absent), update, delete records
- **Dashboard**: Real-time stats — headcount by department, today's attendance breakdown
- **Per-employee Attendance Summary**: Attendance rate, days present/absent
- **Search & Filtering**: Search employees by name/ID/email; filter attendance by date or employee
- **Validation**: Server-side field validation, duplicate detection, meaningful error messages
- **UI/UX**: Dark theme, loading/empty/error states, toast notifications, responsive layout

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18, React Router v6     |
| Styling   | Plain CSS (no UI library)     |
| HTTP      | Axios                         |
| Backend   | Django 4.2 + Django REST Framework |
| Database  | MongoDB via pymongo           |
| Fonts     | Syne (display) + DM Sans (body) |

---

## Project Structure

```
hrms/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── hrms_project/
│   │   ├── settings.py       # Django settings + MongoDB config
│   │   ├── urls.py           # Root URL routing
│   │   ├── db.py             # MongoDB singleton connection + indexes
│   │   ├── exception_handler.py  # Global DRF error handler
│   │   └── wsgi.py
│   └── apps/
│       ├── employees/
│       │   ├── views.py      # Employee CRUD + Dashboard + Departments
│       │   ├── validators.py # Field validation logic
│       │   └── urls.py
│       └── attendance/
│           ├── views.py      # Attendance CRUD + Summary + Bulk
│           └── urls.py
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx
        ├── index.css         # Design system (CSS variables + all styles)
        ├── services/
        │   └── api.js        # Axios instance + all API calls
        ├── hooks/
        │   └── useAsync.js   # Reusable data fetching hooks
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Modal.jsx
        │   ├── Toast.jsx           # Toast notification system
        │   ├── UI.jsx              # LoadingState, EmptyState, ErrorState, Avatar, StatusBadge
        │   ├── AddEmployeeModal.jsx
        │   └── MarkAttendanceModal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Employees.jsx
            └── Attendance.jsx
```

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set MONGO_URI, SECRET_KEY, etc.

# Run development server
python manage.py runserver
```

The backend will start at **http://localhost:8000**

> **Note**: No `manage.py migrate` needed — MongoDB is schema-less.

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — proxy is set in package.json)
cp .env.example .env

# Start development server
npm start
```

The frontend will start at **http://localhost:3000**

---

## API Reference

### Employees

| Method | Endpoint                        | Description                      |
|--------|---------------------------------|----------------------------------|
| GET    | `/api/employees/`               | List employees (search, dept filter) |
| POST   | `/api/employees/`               | Create employee                  |
| GET    | `/api/employees/<employee_id>/` | Get employee detail              |
| DELETE | `/api/employees/<employee_id>/` | Delete employee + their attendance |

**POST /api/employees/ — Request Body:**
```json
{
  "employee_id": "EMP001",
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "department": "Engineering"
}
```

### Attendance

| Method | Endpoint                                        | Description                  |
|--------|-------------------------------------------------|------------------------------|
| GET    | `/api/attendance/`                              | List records (filters: employee_id, date, month) |
| POST   | `/api/attendance/`                              | Mark attendance              |
| PUT    | `/api/attendance/<employee_id>/<date>/`         | Update attendance status     |
| DELETE | `/api/attendance/<employee_id>/<date>/`         | Delete record                |
| GET    | `/api/attendance/summary/<employee_id>/`        | Employee attendance summary  |
| POST   | `/api/attendance/bulk/`                         | Bulk mark attendance         |

**POST /api/attendance/ — Request Body:**
```json
{
  "employee_id": "EMP001",
  "date": "2026-02-19",
  "status": "Present"
}
```

### Other

| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | `/api/departments/` | List departments     |
| GET    | `/api/dashboard/`   | Summary statistics   |

---

## Error Response Format

All API errors follow a consistent structure:

```json
{
  "success": false,
  "error": "Human-readable error message.",
  "fields": {                // Only present for validation errors
    "email": "Please provide a valid email address."
  }
}
```

### HTTP Status Codes Used

| Code | Meaning                    |
|------|----------------------------|
| 200  | Success                    |
| 201  | Created                    |
| 400  | Validation error           |
| 404  | Resource not found         |
| 409  | Conflict (duplicate)       |
| 503  | Database unavailable       |

---

## MongoDB Indexes

Created automatically on first connection:

- `employees.employee_id` — unique
- `employees.email` — unique
- `attendance.(employee_id, date)` — unique compound
- `attendance.date` — for date filtering
- `attendance.employee_id` — for employee filtering

---

## Production Deployment

### Backend (e.g., Railway, Render, EC2)

1. Set `DEBUG=False` in `.env`
2. Set a strong `SECRET_KEY`
3. Set `ALLOWED_HOSTS=yourdomain.com`
4. Set `MONGO_URI` to your production MongoDB Atlas URI
5. Run with Gunicorn: `gunicorn hrms_project.wsgi:application`

### Frontend (e.g., Vercel, Netlify)

1. Set `REACT_APP_API_URL=https://your-api-domain.com/api`
2. Run `npm run build`
3. Deploy the `build/` folder

---

## Design Decisions

- **pymongo directly** (not djongo/mongoengine): More control, simpler, no ORM overhead for document-style data.
- **No Django auth models**: Single-admin system per spec — avoids unnecessary complexity.
- **CSS Variables design system**: No Tailwind/UI library — demonstrates raw CSS proficiency and full control.
- **Centralized error handling**: Both the DRF exception handler (backend) and Axios interceptor (frontend) normalize errors so all components consume a consistent error format.
- **Cascade delete**: Deleting an employee automatically removes all their attendance records to maintain data integrity.
