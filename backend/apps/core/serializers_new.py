"""
Serializers del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Cargo, Permiso, CargoPermiso
