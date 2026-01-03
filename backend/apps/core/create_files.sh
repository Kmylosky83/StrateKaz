#!/bin/bash

# Script para crear archivos de la API REST

CORE_DIR="."

# Crear serializers.py
cat > "${CORE_DIR}/serializers.py" <<'SERIALIZERS_END'
"""
Serializers del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Cargo, Permiso, CargoPermiso


class CargoSerializer(serializers.ModelSerializer):
    """Serializer básico para Cargo"""

    level_display = serializers.CharField(source='get_level_display', read_only=True)
    subordinados_count = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            'id',
            'code',
            'name',
            'description',
            'level',
            'level_display',
            'parent_cargo',
            'is_active',
            'subordinados_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_subordinados_count(self, obj):
        """Retorna la cantidad de subordinados directos"""
        return obj.subordinados.filter(is_active=True).count()
SERIALIZERS_END

echo "Archivos creados exitosamente"
