"""
Examples of how to use the structured logging system.

This module demonstrates different logging patterns and best practices
for the Django application.
"""
import logging

# Get logger for this module
logger = logging.getLogger(__name__)


def example_basic_logging():
    """Basic logging examples."""
    logger.debug("Debug message - detailed information for diagnosing problems")
    logger.info("Info message - general informational messages")
    logger.warning("Warning message - something unexpected happened")
    logger.error("Error message - a serious problem occurred")
    logger.critical("Critical message - the application may be unable to continue")


def example_logging_with_extra_fields():
    """Logging with extra contextual information."""
    # Extra fields will be added to the 'extra' section in JSON logs
    logger.info(
        "User logged in successfully",
        extra={
            'user_id': 123,
            'username': 'john_doe',
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0...',
        }
    )

    logger.info(
        "Database query executed",
        extra={
            'query_time_ms': 45.2,
            'table': 'users',
            'operation': 'SELECT',
            'rows_affected': 100,
        }
    )


def example_logging_exceptions():
    """Logging exceptions with full traceback."""
    try:
        # Simulate an error
        result = 10 / 0
    except ZeroDivisionError as e:
        # Log the exception with full traceback
        logger.error(
            "Division by zero error occurred",
            exc_info=True,  # This adds the full traceback to the log
            extra={
                'operation': 'division',
                'numerator': 10,
                'denominator': 0,
            }
        )

    # Alternative: using logger.exception (automatically includes exc_info=True)
    try:
        data = {'key': 'value'}
        value = data['missing_key']
    except KeyError as e:
        logger.exception(
            "Missing key in data dictionary",
            extra={
                'data_keys': list(data.keys()),
                'requested_key': 'missing_key',
            }
        )


def example_request_logging(request, response):
    """
    Example of logging HTTP requests and responses.

    Args:
        request: Django HttpRequest object
        response: Django HttpResponse object
    """
    logger.info(
        "HTTP request processed",
        extra={
            'method': request.method,
            'path': request.path,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'ip_address': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'status_code': response.status_code,
            'response_time_ms': 123.45,  # You would calculate this
        }
    )


def example_business_logic_logging():
    """Example of logging business logic events."""
    # Order created
    logger.info(
        "Order created successfully",
        extra={
            'order_id': 'ORD-2024-001',
            'customer_id': 456,
            'total_amount': 1500.00,
            'currency': 'COP',
            'items_count': 3,
        }
    )

    # Payment processed
    logger.info(
        "Payment processed",
        extra={
            'order_id': 'ORD-2024-001',
            'payment_method': 'credit_card',
            'amount': 1500.00,
            'transaction_id': 'TXN-789',
            'status': 'approved',
        }
    )

    # Inventory updated
    logger.info(
        "Inventory updated",
        extra={
            'product_id': 'PROD-123',
            'previous_quantity': 100,
            'new_quantity': 97,
            'change': -3,
            'reason': 'sale',
        }
    )


def example_security_logging():
    """Example of security-related logging."""
    # Use the security logger
    security_logger = logging.getLogger('django.security')

    # Failed login attempt
    security_logger.warning(
        "Failed login attempt",
        extra={
            'username': 'john_doe',
            'ip_address': '192.168.1.100',
            'attempt_number': 3,
            'reason': 'invalid_password',
        }
    )

    # Unauthorized access attempt
    security_logger.warning(
        "Unauthorized access attempt",
        extra={
            'user_id': 123,
            'resource': '/admin/users/',
            'required_permission': 'users.view_user',
            'user_permissions': ['users.view_ownprofile'],
        }
    )

    # Suspicious activity
    security_logger.error(
        "Suspicious activity detected",
        extra={
            'user_id': 123,
            'activity': 'mass_data_export',
            'records_exported': 10000,
            'time_window_minutes': 5,
        }
    )


def example_performance_logging():
    """Example of performance monitoring."""
    import time

    start_time = time.time()

    # Simulate some work
    time.sleep(0.1)

    duration_ms = (time.time() - start_time) * 1000

    if duration_ms > 100:  # Threshold: 100ms
        logger.warning(
            "Slow operation detected",
            extra={
                'operation': 'generate_report',
                'duration_ms': duration_ms,
                'threshold_ms': 100,
                'parameters': {
                    'report_type': 'monthly_sales',
                    'date_range': '2024-01-01 to 2024-01-31',
                },
            }
        )


def example_celery_task_logging():
    """Example of logging in Celery tasks."""
    task_logger = logging.getLogger('celery')

    # Task started
    task_logger.info(
        "Celery task started",
        extra={
            'task_name': 'process_invoice',
            'task_id': 'abc-123-def',
            'args': {'invoice_id': 789},
        }
    )

    # Task progress
    task_logger.info(
        "Task progress update",
        extra={
            'task_id': 'abc-123-def',
            'progress_percent': 50,
            'items_processed': 50,
            'total_items': 100,
        }
    )

    # Task completed
    task_logger.info(
        "Celery task completed",
        extra={
            'task_name': 'process_invoice',
            'task_id': 'abc-123-def',
            'duration_seconds': 45.2,
            'result': 'success',
        }
    )


# Example of a custom logger with specific behavior
class DatabaseQueryLogger:
    """Custom logger for database operations."""

    def __init__(self):
        self.logger = logging.getLogger('apps.database')

    def log_query(self, query_type, table, duration_ms, rows_affected=None):
        """
        Log a database query with consistent structure.

        Args:
            query_type: Type of query (SELECT, INSERT, UPDATE, DELETE)
            table: Table name
            duration_ms: Query duration in milliseconds
            rows_affected: Number of rows affected (optional)
        """
        extra = {
            'query_type': query_type,
            'table': table,
            'duration_ms': duration_ms,
        }

        if rows_affected is not None:
            extra['rows_affected'] = rows_affected

        # Warn on slow queries
        if duration_ms > 1000:  # 1 second threshold
            self.logger.warning(f"Slow {query_type} query on {table}", extra=extra)
        else:
            self.logger.debug(f"{query_type} query on {table}", extra=extra)


# Usage example
if __name__ == '__main__':
    # Configure logging (normally done by Django settings)
    logging.basicConfig(level=logging.DEBUG)

    # Run examples
    example_basic_logging()
    example_logging_with_extra_fields()
    example_logging_exceptions()
    example_business_logic_logging()
    example_security_logging()
    example_performance_logging()
