"""
Custom logging formatters for structured logging.
"""
import json
import logging
import traceback
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging.

    Outputs log records as JSON objects with the following structure:
    {
        "timestamp": "2025-12-23T10:30:45.123456",
        "level": "INFO",
        "logger": "apps.core.views",
        "message": "User logged in",
        "module": "views",
        "function": "login_view",
        "line": 42,
        "process": 12345,
        "thread": 67890,
        "thread_name": "MainThread",
        "extra": {...}  # Any extra fields passed to the logger
    }
    """

    # Fields to exclude from the 'extra' section
    RESERVED_FIELDS = {
        'name', 'msg', 'args', 'created', 'filename', 'funcName', 'levelname',
        'levelno', 'lineno', 'module', 'msecs', 'message', 'pathname', 'process',
        'processName', 'relativeCreated', 'thread', 'threadName', 'exc_info',
        'exc_text', 'stack_info', 'asctime', 'taskName'
    }

    def format(self, record):
        """
        Format the log record as a JSON string.

        Args:
            record: LogRecord instance

        Returns:
            str: JSON formatted log message
        """
        # Build the base log object
        log_object = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process': record.process,
            'thread': record.thread,
            'thread_name': record.threadName,
        }

        # Add exception info if present
        if record.exc_info:
            log_object['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'value': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info)
            }

        # Add stack info if present
        if hasattr(record, 'stack_info') and record.stack_info:
            log_object['stack_info'] = record.stack_info

        # Add custom fields to 'extra' section
        extra_fields = {}
        for key, value in record.__dict__.items():
            if key not in self.RESERVED_FIELDS and not key.startswith('_'):
                # Convert non-serializable objects to strings
                try:
                    json.dumps({key: value})
                    extra_fields[key] = value
                except (TypeError, ValueError):
                    extra_fields[key] = str(value)

        if extra_fields:
            log_object['extra'] = extra_fields

        # Convert to JSON string
        try:
            return json.dumps(log_object, ensure_ascii=False, default=str)
        except Exception as e:
            # Fallback to simple format if JSON serialization fails
            return json.dumps({
                'timestamp': datetime.fromtimestamp(record.created).isoformat(),
                'level': record.levelname,
                'logger': record.name,
                'message': f"JSON serialization error: {str(e)}",
                'original_message': str(record.getMessage())
            })


class ColoredVerboseFormatter(logging.Formatter):
    """
    Enhanced verbose formatter with color coding for terminal output.
    Uses ANSI color codes for better readability in development.
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }

    def format(self, record):
        """
        Format with color if the handler is a console handler.

        Args:
            record: LogRecord instance

        Returns:
            str: Formatted and optionally colored log message
        """
        # Get color for this level
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']

        # Color the level name
        record.levelname = f"{color}{record.levelname}{reset}"

        return super().format(record)
