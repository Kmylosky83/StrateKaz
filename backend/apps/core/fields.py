"""
Custom DRF Fields para el proyecto
"""
from rest_framework import serializers
from datetime import datetime, date


class NaiveDateField(serializers.DateField):
    """
    DateField que ignora timezone information.

    Para campos de solo fecha (sin hora), no debería haber conversión
    de zona horaria. Este field asegura que la fecha recibida sea
    la fecha guardada, sin importar timezone.

    Uso:
        fecha_programada = NaiveDateField()

    Problema que resuelve:
        - Input: "2024-12-01" desde frontend
        - Con DateField normal + USE_TZ=True: puede convertirse a "2024-11-30"
        - Con NaiveDateField: siempre "2024-12-01"
    """

    def to_internal_value(self, value):
        """
        Convierte el input a date, extrayendo solo la fecha si es datetime
        """
        # Si ya es un objeto date
        if isinstance(value, date):
            return value

        # Si es datetime, extraer solo la fecha (ignorar timezone)
        if isinstance(value, datetime):
            return value.date()

        # Si es string, parsear normalmente
        if isinstance(value, str):
            # Remover cualquier información de timezone del string
            # Casos: "2024-12-01", "2024-12-01T00:00:00", "2024-12-01T00:00:00Z"
            if 'T' in value:
                # Extraer solo la parte de fecha
                value = value.split('T')[0]

            # Usar el parser padre que maneja los input_formats
            parsed_datetime = super().to_internal_value(value)

            # Si el parser retorna datetime, extraer la fecha
            if isinstance(parsed_datetime, datetime):
                return parsed_datetime.date()

            return parsed_datetime

        # Para otros tipos, delegar al parser padre
        return super().to_internal_value(value)

    def to_representation(self, value):
        """
        Convierte date a string en formato ISO (YYYY-MM-DD)
        """
        if not value:
            return None

        if isinstance(value, datetime):
            value = value.date()

        # Retornar en formato ISO estándar
        return value.isoformat()
