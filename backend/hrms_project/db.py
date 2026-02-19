"""
MongoDB connection utility using pymongo.
Provides a singleton database connection.
"""

import pymongo
from django.conf import settings


class MongoDBConnection:
    _client = None
    _db = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = pymongo.MongoClient(settings.MONGO_URI)
        return cls._client

    @classmethod
    def get_db(cls):
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[settings.MONGO_DB_NAME]
            cls._ensure_indexes()
        return cls._db

    @classmethod
    def _ensure_indexes(cls):
        """Create indexes for performance and uniqueness constraints."""
        db = cls._db
        # Unique index on employee_id
        db.employees.create_index('employee_id', unique=True)
        # Unique index on email
        db.employees.create_index('email', unique=True)
        # Compound index for attendance (employee + date unique)
        db.attendance.create_index(
            [('employee_id', pymongo.ASCENDING), ('date', pymongo.ASCENDING)],
            unique=True
        )
        # Index for attendance queries by date
        db.attendance.create_index('date')
        # Index for attendance queries by employee
        db.attendance.create_index('employee_id')


def get_db():
    """Convenience function to get the database instance."""
    return MongoDBConnection.get_db()
