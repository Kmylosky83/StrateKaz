# Sistema de Workflows y Firmas Digitales

**Sistema de Gestión StrateKaz - Enterprise Multi-Tenant**

**Fecha:** 2026-02-06
**Versión:** 2.0.0
**Autor:** Equipo de Arquitectura

---

## Índice

1. [Visión General](#visión-general)
2. [Cumplimiento Normativo](#cumplimiento-normativo)
3. [Arquitectura del Sistema Backend](#arquitectura-del-sistema-backend)
4. [Implementación Backend Django](#implementación-backend-django)
5. [Workflow de Firmas Múltiples](#workflow-de-firmas-múltiples)
6. [Ciclo de Revisión Periódica](#ciclo-de-revisión-periódica)
7. [Implementación Frontend React](#implementación-frontend-react)
8. [Casos de Uso Específicos](#casos-de-uso-específicos)
9. [Configuración y Despliegue](#configuración-y-despliegue)
10. [Testing y Calidad](#testing-y-calidad)

---

## 1. Visión General

Sistema profesional de gestión de políticas con workflow completo de firmas digitales manuscritas y ciclo de revisión periódica automatizado, diseñado para cumplir con normativas colombianas (Decreto 1072/2015) y estándares internacionales ISO.

### Características Principales

#### Firma Digital Manuscrita
- Captura de firma en canvas HTML5 (formato base64/PNG)
- Verificación de integridad mediante hash SHA-256
- Metadatos completos: IP, navegador, timestamp, geolocalización
- Almacenamiento optimizado (Base64 o archivo según tamaño)
- Compatibilidad móvil completa (touch events)

#### Workflow de Firmas Múltiples
- Orden secuencial o paralelo configurable
- Roles predefinidos: Elaboró, Revisó, Aprobó, Validó, Autorizó
- Delegación de firma con trazabilidad completa
- Rechazo con comentarios obligatorios y notificaciones
- Historial completo de intentos y cambios

#### Ciclo de Revisión Periódica
- Frecuencias: anual, semestral, trimestral, bianual, personalizada
- Alertas automáticas configurables (30, 15, 7 días antes)
- Renovación automática vs nueva versión
- Versionamiento semántico (1.0 → 1.1 → 2.0)
- Escalamiento automático para políticas críticas

#### Versionamiento y Trazabilidad
- Snapshot completo JSON de cada versión
- Comparación visual entre versiones (diff detallado)
- Restauración de versiones anteriores
- Hash de verificación de integridad por versión
- Historial inmutable de cambios

---

## 2. Cumplimiento Normativo

### ISO 9001:2015 - Sistema de Gestión de Calidad

**Cláusula 5.2: Política de Calidad**
- Documentación de política con firma de alta dirección
- Disponible y comunicada a toda la organización
- Revisión periódica para adecuación continua

**Cláusula 7.5: Información Documentada**
- Control de documentos (versiones, aprobación, distribución)
- Identificación única y trazabilidad
- Protección contra cambios no autorizados

### ISO 45001:2018 - Seguridad y Salud en el Trabajo

**Cláusula 5.2: Política de SST**
- Compromiso de alta dirección documentado
- Apropiada al propósito y contexto de la organización
- Marco para objetivos de SST
- Revisión mínima anual obligatoria

**Cláusula 5.4: Consulta y Participación**
- Participación de trabajadores en elaboración y revisión
- Registro de consultas y retroalimentación

### Decreto 1072 de 2015 - Colombia (SST)

**Art. 2.2.4.6.5: Política de Seguridad y Salud en el Trabajo**
- Firmada por el empleador o representante legal
- Comunicada al COPASST o Vigía SST
- Fechada y firmada obligatoriamente
- Revisión mínima anual

**Resolución 0312 de 2019: Estándares Mínimos SG-SST**
- Política firmada por el representante legal
- Fechada y revisada mínimo una vez al año
- Comunicada a toda la organización

### ISO 14001:2015 - Sistema de Gestión Ambiental

**Cláusula 5.2: Política Ambiental**
- Apropiada al propósito y contexto de la organización
- Marco para objetivos ambientales
- Disponible a partes interesadas

### ISO 27001:2022 - Seguridad de la Información

**Cláusula 5.2: Política de Seguridad de la Información**
- Aprobada por la dirección
- Comunicada a empleados y partes interesadas relevantes
- Revisión periódica documentada

---

## 3. Arquitectura del Sistema Backend

### Stack Tecnológico

#### Backend
- **Framework**: Django 4.2+ / Django REST Framework 3.14+
- **Base de datos**: PostgreSQL 14+ (multi-tenant con esquemas separados)
- **Tareas asíncronas**: Celery 5.3+ con Redis/RabbitMQ
- **Almacenamiento**: Local / AWS S3 / Azure Blob Storage
- **Autenticación**: JWT (SimpleJWT)

#### Frontend
- **Framework**: React 18+ con TypeScript
- **Manejo de estado**: Zustand / React Query
- **Formularios**: React Hook Form + Zod
- **Firma manuscrita**: react-signature-canvas (wrapper de signature_pad)
- **UI Components**: Tailwind CSS + Headless UI / Shadcn

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN (Frontend)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Canvas Firma │  │ Visor Diffs  │  │ Dashboard    │         │
│  │ Manuscrita   │  │ Versiones    │  │ Revisiones   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (JSON/JWT)
┌───────────────────────────▼─────────────────────────────────────┐
│                CAPA DE LÓGICA DE NEGOCIO (Django)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                ViewSets (Django REST)                    │  │
│  │  - FirmaDigitalViewSet                                   │  │
│  │  - ConfiguracionRevisionViewSet                          │  │
│  │  - HistorialVersionViewSet                               │  │
│  │  - ConfiguracionWorkflowFirmaViewSet                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Modelos de Negocio (Models)                 │  │
│  │  - DigitalSignature (firma manuscrita)                   │  │
│  │  - ConfiguracionRevision (revisiones periódicas)         │  │
│  │  - HistorialVersion (versionamiento)                     │  │
│  │  - ConfiguracionWorkflowFirma (configuración workflow)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Tareas Asíncronas (Celery Beat)               │  │
│  │  - verificar_firmas_vencidas (diario 08:00)              │  │
│  │  - verificar_revisiones_pendientes (diario 09:00)        │  │
│  │  - enviar_alertas_revision (diario 10:00)                │  │
│  │  - actualizar_estados_revision (diario 00:30)            │  │
│  │  - auto_renovar_politicas (semanal lunes 08:00)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│               CAPA DE PERSISTENCIA (PostgreSQL)                 │
│  - identidad_firma_digital                                      │
│  - identidad_configuracion_revision                             │
│  - identidad_historial_version                                  │
│  - identidad_config_workflow_firma                              │
│  - identidad_politica_integral                                  │
│  - identidad_politica_especifica                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementación Backend Django

### 4.1. Modelo de Firma Digital Reutilizable

**Ubicación**: `backend/apps/core/models/signature.py`

```python
"""
Modelo de Firma Digital Reutilizable
Sistema de Gestión StrateKaz

Características:
- Almacenamiento eficiente (Base64 optimizado o archivo)
- Hash SHA-256 para verificación de integridad
- Metadatos completos (usuario, IP, timestamp, dispositivo)
- Geolocalización opcional
- Auditoría completa
"""

import hashlib
import base64
from typing import Optional, Dict, Any
from PIL import Image
from io import BytesIO
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.contrib.postgres.fields import JSONField


class SignatureMetadata(models.Model):
    """
    Modelo abstracto con metadata común para firmas digitales.
    """

    # Hash de integridad (SHA-256)
    signature_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Hash de Firma',
        help_text='SHA-256 hash de la firma para verificación de integridad'
    )

    # Información del dispositivo
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent',
        help_text='Información del navegador/dispositivo'
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP',
        help_text='IP desde donde se realizó la firma'
    )
    device_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Información del Dispositivo',
        help_text='Detalles del dispositivo (OS, browser, screen size)'
    )

    # Geolocalización (opcional)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name='Latitud'
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name='Longitud'
    )

    # Timestamps
    signed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha y Hora de Firma'
    )

    # Verificación
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Verificada'
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['signature_hash', 'signed_at']),
            models.Index(fields=['ip_address', 'signed_at']),
            models.Index(fields=['is_verified', 'signed_at']),
        ]


class DigitalSignature(BaseCompanyModel, SignatureMetadata):
    """
    Modelo concreto para almacenar firmas digitales manuscritas.

    Multi-tenant, con auditoría completa y soft delete.
    """

    class SignatureType(models.TextChoices):
        DOCUMENTO = 'DOC', 'Firma de Documento'
        ACTA = 'ACT', 'Firma de Acta'
        INSPECCION = 'INS', 'Firma de Inspección'
        CAPACITACION = 'CAP', 'Firma de Capacitación'
        ASISTENCIA = 'ASI', 'Firma de Asistencia'
        REVISION = 'REV', 'Firma de Revisión'
        APROBACION = 'APR', 'Firma de Aprobación'
        ENTREGA = 'ENT', 'Firma de Entrega/Recibido'
        OTRO = 'OTR', 'Otro'

    # Identificador del recurso firmado (Generic FK simulation)
    content_type = models.CharField(
        max_length=100,
        verbose_name='Tipo de Contenido',
        help_text='Tipo de modelo firmado (ej: Incident, Document)'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del Objeto',
        help_text='ID del registro firmado'
    )

    # Tipo de firma
    signature_type = models.CharField(
        max_length=3,
        choices=SignatureType.choices,
        default=SignatureType.OTRO,
        db_index=True,
        verbose_name='Tipo de Firma'
    )

    # Firmante
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='signatures_as_signer',
        verbose_name='Firmante'
    )
    signer_name = models.CharField(
        max_length=200,
        verbose_name='Nombre del Firmante',
        help_text='Nombre completo (cached para histórico)'
    )
    signer_document = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Documento del Firmante'
    )
    signer_position = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Cargo del Firmante'
    )

    # Almacenamiento: Opción 1 - Base64 (<100KB)
    signature_base64 = models.TextField(
        blank=True,
        verbose_name='Firma (Base64)',
        help_text='Firma codificada en Base64 (PNG)'
    )

    # Almacenamiento: Opción 2 - Archivo (>100KB o S3)
    signature_file = models.FileField(
        upload_to='signatures/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='Archivo de Firma'
    )

    # Dimensiones de la imagen
    image_width = models.PositiveIntegerField(null=True, blank=True)
    image_height = models.PositiveIntegerField(null=True, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)

    # Contexto adicional
    context_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de Contexto'
    )

    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )

    class Meta:
        verbose_name = 'Firma Digital'
        verbose_name_plural = 'Firmas Digitales'
        ordering = ['-signed_at']
        indexes = [
            models.Index(fields=['empresa', 'content_type', 'object_id']),
            models.Index(fields=['empresa', 'signer', '-signed_at']),
            models.Index(fields=['empresa', 'signature_type', '-signed_at']),
        ]

    def __str__(self):
        return f"{self.signer_name} - {self.get_signature_type_display()} - {self.signed_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        """Override save para auto-calcular hash y metadatos."""
        if not self.signature_hash:
            self.signature_hash = self.calculate_hash()

        if self.signer and not self.signer_name:
            self.signer_name = self.signer.get_full_name() or self.signer.email

        if self.signature_base64 and not self.image_width:
            self._extract_image_metadata_from_base64()

        if self.signature_file and not self.image_width:
            self._extract_image_metadata_from_file()

        super().save(*args, **kwargs)

    def calculate_hash(self) -> str:
        """Calcula el hash SHA-256 de la firma."""
        if self.signature_base64:
            base64_data = self.signature_base64.split(',')[-1]
            image_bytes = base64.b64decode(base64_data)
        elif self.signature_file:
            self.signature_file.seek(0)
            image_bytes = self.signature_file.read()
        else:
            raise ValueError("No signature data available to hash")

        return hashlib.sha256(image_bytes).hexdigest()

    def verify_integrity(self) -> bool:
        """
        Verifica la integridad de la firma comparando hashes.

        Returns:
            bool: True si la firma es íntegra
        """
        try:
            current_hash = self.calculate_hash()
            is_valid = current_hash == self.signature_hash

            if is_valid:
                self.is_verified = True
                self.verified_at = timezone.now()
                self.save(update_fields=['is_verified', 'verified_at'])

            return is_valid
        except Exception as e:
            return False

    def get_image_data_url(self) -> Optional[str]:
        """
        Retorna la firma como data URL para renderizado.
        """
        if self.signature_base64:
            if self.signature_base64.startswith('data:image'):
                return self.signature_base64
            return f"data:image/png;base64,{self.signature_base64}"

        if self.signature_file:
            try:
                self.signature_file.seek(0)
                image_bytes = self.signature_file.read()
                base64_string = base64.b64encode(image_bytes).decode('utf-8')
                return f"data:image/png;base64,{base64_string}"
            except Exception:
                return None

        return None

    @classmethod
    def create_from_base64(
        cls,
        empresa,
        signer,
        signature_base64: str,
        content_type: str,
        object_id: int,
        signature_type: str,
        ip_address: str,
        user_agent: str = '',
        device_info: dict = None,
        latitude: float = None,
        longitude: float = None,
        context_data: dict = None,
        notes: str = '',
        created_by=None,
    ) -> 'DigitalSignature':
        """
        Factory method para crear firma desde Base64.
        """
        signature = cls(
            empresa=empresa,
            signer=signer,
            signature_base64=signature_base64,
            content_type=content_type,
            object_id=object_id,
            signature_type=signature_type,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info or {},
            latitude=latitude,
            longitude=longitude,
            context_data=context_data or {},
            notes=notes,
            created_by=created_by or signer,
        )

        if hasattr(signer, 'profile'):
            signature.signer_document = signer.profile.document_number or ''
            signature.signer_position = signer.profile.position or ''

        signature.save()
        return signature
```

### 4.2. Serializers

**Ubicación**: `backend/apps/core/serializers/signature.py`

```python
"""
Serializers para Firma Digital
"""

from rest_framework import serializers
from apps.core.models.signature import DigitalSignature


class DigitalSignatureSerializer(serializers.ModelSerializer):
    """Serializer completo para firmas digitales."""

    signer_display = serializers.SerializerMethodField()
    signature_data_url = serializers.SerializerMethodField()
    is_integrity_valid = serializers.SerializerMethodField()

    class Meta:
        model = DigitalSignature
        fields = [
            'id',
            'empresa',
            'content_type',
            'object_id',
            'signature_type',
            'signer',
            'signer_display',
            'signer_name',
            'signer_document',
            'signer_position',
            'signature_hash',
            'signature_data_url',
            'image_width',
            'image_height',
            'file_size_bytes',
            'signed_at',
            'ip_address',
            'user_agent',
            'device_info',
            'latitude',
            'longitude',
            'is_verified',
            'verified_at',
            'is_integrity_valid',
            'context_data',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'signature_hash',
            'image_width',
            'image_height',
            'file_size_bytes',
            'signed_at',
            'is_verified',
            'verified_at',
        ]

    def get_signer_display(self, obj):
        return {
            'id': obj.signer.id,
            'name': obj.signer_name,
            'email': obj.signer.email,
            'document': obj.signer_document,
            'position': obj.signer_position,
        }

    def get_signature_data_url(self, obj):
        return obj.get_image_data_url()

    def get_is_integrity_valid(self, obj):
        return obj.verify_integrity()


class CreateSignatureSerializer(serializers.Serializer):
    """Serializer para crear firmas desde frontend."""

    content_type = serializers.CharField(max_length=100)
    object_id = serializers.IntegerField()
    signature_type = serializers.ChoiceField(
        choices=DigitalSignature.SignatureType.choices
    )
    signature_base64 = serializers.CharField(required=True)
    signer_document = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True
    )
    signer_position = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True
    )
    latitude = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        required=False,
        allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        required=False,
        allow_null=True
    )
    context_data = serializers.JSONField(required=False, default=dict)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_signature_base64(self, value):
        """Valida que el Base64 sea válido."""
        import base64
        try:
            if value.startswith('data:image'):
                value = value.split(',')[1]
            base64.b64decode(value)
            return value
        except Exception:
            raise serializers.ValidationError("Base64 inválido")

    def create(self, validated_data):
        from apps.core.models.signature import get_client_ip

        request = self.context.get('request')
        user = request.user
        empresa = request.user.empresa

        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=validated_data['signature_base64'],
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            signature_type=validated_data['signature_type'],
            ip_address=ip_address,
            user_agent=user_agent,
            device_info={},
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude'),
            context_data=validated_data.get('context_data', {}),
            notes=validated_data.get('notes', ''),
            created_by=user,
        )

        if validated_data.get('signer_document'):
            signature.signer_document = validated_data['signer_document']
        if validated_data.get('signer_position'):
            signature.signer_position = validated_data['signer_position']

        signature.save()
        return signature
```

### 4.3. ViewSets

**Ubicación**: `backend/apps/core/views/signature.py`

```python
"""
ViewSets para Firmas Digitales
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from apps.core.models.signature import DigitalSignature
from apps.core.serializers.signature import (
    DigitalSignatureSerializer,
    CreateSignatureSerializer,
)


class DigitalSignatureFilter(filters.FilterSet):
    """Filtros para firmas digitales."""

    content_type = filters.CharFilter()
    object_id = filters.NumberFilter()
    signature_type = filters.ChoiceFilter(
        choices=DigitalSignature.SignatureType.choices
    )
    signer = filters.NumberFilter(field_name='signer__id')
    signed_after = filters.DateTimeFilter(field_name='signed_at', lookup_expr='gte')
    signed_before = filters.DateTimeFilter(field_name='signed_at', lookup_expr='lte')
    is_verified = filters.BooleanFilter()

    class Meta:
        model = DigitalSignature
        fields = [
            'content_type',
            'object_id',
            'signature_type',
            'signer',
            'is_verified',
        ]


class DigitalSignatureViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de firmas digitales.

    Endpoints:
    - GET    /api/signatures/                    - Listar firmas
    - POST   /api/signatures/                    - Crear firma
    - GET    /api/signatures/{id}/               - Detalle firma
    - DELETE /api/signatures/{id}/               - Eliminar (soft delete)
    - POST   /api/signatures/{id}/verify/        - Verificar integridad
    - GET    /api/signatures/by-document/        - Por documento
    - GET    /api/signatures/my-signatures/      - Mis firmas
    """

    permission_classes = [IsAuthenticated]
    serializer_class = DigitalSignatureSerializer
    filterset_class = DigitalSignatureFilter
    ordering_fields = ['signed_at', 'signer_name']
    ordering = ['-signed_at']

    def get_queryset(self):
        """Filtra firmas por empresa (multi-tenant)."""
        user = self.request.user
        return DigitalSignature.objects.filter(
            empresa=user.empresa,
            is_active=True
        ).select_related('signer', 'empresa', 'created_by')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSignatureSerializer
        return DigitalSignatureSerializer

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verifica la integridad de una firma.

        POST /api/signatures/{id}/verify/
        """
        signature = self.get_object()
        is_valid = signature.verify_integrity()

        return Response({
            'is_valid': is_valid,
            'message': (
                'Firma verificada correctamente' if is_valid
                else 'La firma ha sido modificada o es inválida'
            ),
            'signature_info': {
                'id': signature.id,
                'hash': signature.signature_hash,
                'signed_at': signature.signed_at.isoformat(),
                'signer': signature.signer_name,
            },
        })

    @action(detail=False, methods=['get'])
    def by_document(self, request):
        """
        Busca firmas por documento.

        GET /api/signatures/by-document/?content_type=XXX&object_id=123
        """
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')

        if not content_type or not object_id:
            return Response(
                {'error': 'Se requieren content_type y object_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        signatures = self.get_queryset().filter(
            content_type=content_type,
            object_id=object_id
        )

        serializer = self.get_serializer(signatures, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_signatures(self, request):
        """
        Obtiene firmas del usuario autenticado.

        GET /api/signatures/my-signatures/
        """
        signatures = self.get_queryset().filter(signer=request.user)
        serializer = self.get_serializer(signatures, many=True)
        return Response(serializer.data)
```

### 4.4. Helpers y Utilidades

```python
# backend/apps/core/models/signature.py (continuación)

def get_client_ip(request):
    """
    Obtiene la IP real del cliente considerando proxies.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_device_info(request) -> dict:
    """
    Extrae información del dispositivo desde el request.
    """
    return {
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        'screen_width': request.data.get('screen_width'),
        'screen_height': request.data.get('screen_height'),
        'os': request.data.get('os'),
        'browser': request.data.get('browser'),
    }
```

---

## 5. Workflow de Firmas Múltiples

### 5.1. Modelo ConfiguracionWorkflowFirma

```python
"""
Modelo de configuración de workflow de firmas múltiples.
"""

class ConfiguracionWorkflowFirma(BaseCompanyModel):
    """
    Configuración reutilizable de workflow de firmas.
    """

    class TipoOrden(models.TextChoices):
        SECUENCIAL = 'SEC', 'Secuencial (orden estricto)'
        PARALELO = 'PAR', 'Paralelo (sin orden)'

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Workflow',
        help_text='Ej: Workflow Política SST'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    tipo_orden = models.CharField(
        max_length=3,
        choices=TipoOrden.choices,
        default=TipoOrden.SECUENCIAL,
        verbose_name='Tipo de Orden'
    )

    # Configuración de roles (JSON)
    # [
    #   {
    #     "rol": "ELABORO",
    #     "orden": 1,
    #     "cargo_id": 5,  // opcional
    #     "usuario_id": 10,  // opcional
    #     "es_obligatorio": true
    #   }
    # ]
    roles_config = models.JSONField(
        default=list,
        verbose_name='Configuración de Roles',
        help_text='Array de roles con orden y asignación'
    )

    dias_para_firmar = models.PositiveIntegerField(
        default=7,
        verbose_name='Días para Firmar',
        help_text='Días límite para completar cada firma'
    )

    permitir_delegacion = models.BooleanField(
        default=True,
        verbose_name='Permitir Delegación'
    )

    notificar_por_email = models.BooleanField(
        default=True,
        verbose_name='Notificar por Email'
    )

    notificar_por_sms = models.BooleanField(
        default=False,
        verbose_name='Notificar por SMS'
    )

    class Meta:
        verbose_name = 'Configuración de Workflow de Firma'
        verbose_name_plural = 'Configuraciones de Workflow de Firma'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_orden_display()})"
```

### 5.2. Flujo Secuencial (Ejemplo)

```
INICIO: Política creada
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: CONFIGURAR WORKFLOW                                 │
│                                                              │
│  Admin crea ConfiguracionWorkflowFirma:                     │
│  - Nombre: "Workflow Política SST"                          │
│  - Tipo: SECUENCIAL                                         │
│  - Roles:                                                    │
│    1. ELABORO (orden: 1) → Cargo: Coordinador SST           │
│    2. REVISO (orden: 2) → Cargo: Gerente HSEQ               │
│    3. APROBO (orden: 3) → Usuario: Gerente General          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: APLICAR WORKFLOW A POLÍTICA                         │
│                                                              │
│  POST /workflow-firmas/1/aplicar/                           │
│  {                                                           │
│    "content_type": "identidad.politicaespecifica",          │
│    "object_id": 45                                          │
│  }                                                           │
│                                                              │
│  Sistema crea 3 firmas:                                     │
│  - Firma 1: ELABORO (PENDIENTE, orden: 1)                   │
│  - Firma 2: REVISO (PENDIENTE, orden: 2)                    │
│  - Firma 3: APROBO (PENDIENTE, orden: 3)                    │
│                                                              │
│  Notifica al primer firmante                                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: FIRMA 1 - ELABORÓ                                   │
│                                                              │
│  Usuario firma en canvas                                    │
│                                                              │
│  POST /firmas-digitales/1/firmar/                           │
│  {                                                           │
│    "firma_base64": "data:image/png;base64,...",             │
│    "observaciones": "Elaborado según Decreto 1072"          │
│  }                                                           │
│                                                              │
│  Sistema:                                                    │
│  - Valida turno (orden: 1)                                  │
│  - Genera hash SHA-256                                      │
│  - Guarda metadatos                                         │
│  - Cambia estado a FIRMADO                                  │
│  - Notifica al siguiente (Gerente HSEQ)                     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
[Continúa con FIRMA 2 y FIRMA 3]
    │
    ▼
FIN: Política VIGENTE con firmas completas
```

### 5.3. Estados de Firma Digital

```
┌──────────────┐
│  PENDIENTE   │ ──firmar()──► ┌──────────┐
└──────────────┘               │ FIRMADO  │
       │                       └──────────┘
       │                             │
       │                             │ (todas completas)
       │                             ▼
       │                    [DOCUMENTO VIGENTE]
       │
       ├──rechazar()──► ┌────────────┐
       │                │ RECHAZADO  │
       │                └────────────┘
       │                      │
       │                      ▼
       │           [WORKFLOW DETENIDO]
       │
       └──delegar()──► ┌────────────┐
                       │  DELEGADO  │
                       └────────────┘
                             │
                             │ nuevo firmante
                             │ firma()
                             ▼
                       ┌──────────┐
                       │ FIRMADO  │
                       └──────────┘
```

---

## 6. Ciclo de Revisión Periódica

### 6.1. Modelo ConfiguracionRevision

```python
"""
Modelo de configuración de revisión periódica.
"""

class ConfiguracionRevision(BaseCompanyModel):
    """
    Configuración de revisión periódica para políticas/documentos.
    """

    class Frecuencia(models.TextChoices):
        ANUAL = 'ANUAL', 'Anual (365 días)'
        SEMESTRAL = 'SEMESTRAL', 'Semestral (180 días)'
        TRIMESTRAL = 'TRIMESTRAL', 'Trimestral (90 días)'
        BIANUAL = 'BIANUAL', 'Bianual (730 días)'
        PERSONALIZADO = 'PERSONALIZADO', 'Personalizado'

    class TipoRevision(models.TextChoices):
        RENOVACION = 'RENOVACION', 'Renovación (sin cambios)'
        NUEVA_VERSION = 'NUEVA_VERSION', 'Nueva Versión (con cambios)'

    class EstadoRevision(models.TextChoices):
        VIGENTE = 'VIGENTE', 'Vigente'
        PROXIMO_VENCIMIENTO = 'PROXIMO_VENCIMIENTO', 'Próximo a vencer'
        VENCIDA = 'VENCIDA', 'Vencida'
        EN_REVISION = 'EN_REVISION', 'En revisión'

    # Generic relation al documento
    content_type_id = models.PositiveIntegerField()
    object_id = models.PositiveIntegerField()

    frecuencia = models.CharField(
        max_length=20,
        choices=Frecuencia.choices,
        default=Frecuencia.ANUAL
    )

    dias_personalizados = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Días para frecuencia personalizada'
    )

    tipo_revision = models.CharField(
        max_length=20,
        choices=TipoRevision.choices,
        default=TipoRevision.NUEVA_VERSION
    )

    auto_renovar = models.BooleanField(
        default=False,
        help_text='Renovar automáticamente si no hay cambios'
    )

    responsable_revision = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_asignadas'
    )

    # Alertas (JSON: [30, 15, 7])
    alertas_dias_previos = models.JSONField(
        default=list,
        help_text='Días previos para enviar alertas (ej: [30, 15, 7])'
    )

    alertar_creador = models.BooleanField(default=True)
    alertar_responsable = models.BooleanField(default=True)

    # Fechas
    ultima_revision = models.DateField(auto_now_add=True)
    proxima_revision = models.DateField()

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoRevision.choices,
        default=EstadoRevision.VIGENTE,
        db_index=True
    )

    habilitado = models.BooleanField(
        default=True,
        db_index=True
    )

    class Meta:
        verbose_name = 'Configuración de Revisión'
        verbose_name_plural = 'Configuraciones de Revisión'
        indexes = [
            models.Index(fields=['content_type_id', 'object_id']),
            models.Index(fields=['estado', 'proxima_revision']),
            models.Index(fields=['habilitado', 'proxima_revision']),
        ]

    def dias_hasta_revision(self) -> int:
        """Calcula días hasta la próxima revisión."""
        from datetime import date
        delta = self.proxima_revision - date.today()
        return delta.days

    def debe_enviar_alerta(self) -> bool:
        """Verifica si debe enviar alerta hoy."""
        dias = self.dias_hasta_revision()
        return dias in self.alertas_dias_previos

    def actualizar_estado(self):
        """Actualiza el estado según días restantes."""
        dias = self.dias_hasta_revision()

        if dias < 0:
            self.estado = self.EstadoRevision.VENCIDA
        elif dias <= 30:
            self.estado = self.EstadoRevision.PROXIMO_VENCIMIENTO
        else:
            self.estado = self.EstadoRevision.VIGENTE

        self.save(update_fields=['estado'])
```

### 6.2. Timeline de Revisión Anual

```
DÍA 0 (15 Enero 2024): Política VIGENTE
    │
    │ ... 335 días ...
    │
    ▼
DÍA 335 (15 Dic 2024): 30 DÍAS ANTES
┌─────────────────────────────────────────────────────────────┐
│ ALERTA 1: 30 días antes del vencimiento                     │
│                                                              │
│ Tarea Celery (10:00 AM):                                    │
│ - verificar: debe_enviar_alerta() → True                    │
│ - enviar_alerta_revision()                                  │
│   → Email + In-App a:                                       │
│     • Responsable de revisión                               │
│     • Creador del documento                                 │
│                                                              │
│ Estado: VIGENTE → PROXIMO_VENCIMIENTO                       │
└─────────────────────────────────────────────────────────────┘
    │
    │ ... 15 días ...
    │
    ▼
DÍA 350 (30 Dic 2024): 15 DÍAS ANTES
┌─────────────────────────────────────────────────────────────┐
│ ALERTA 2: 15 días antes (prioridad: ALTA)                   │
│ Email + In-App + Push                                       │
└─────────────────────────────────────────────────────────────┘
    │
    │ ... 8 días ...
    │
    ▼
DÍA 358 (7 Enero 2025): 7 DÍAS ANTES
┌─────────────────────────────────────────────────────────────┐
│ ALERTA 3: 7 días antes (prioridad: CRITICA)                 │
│ Email + SMS + In-App + Push                                 │
└─────────────────────────────────────────────────────────────┘
    │
    │ ... 7 días ...
    │
    ▼
DÍA 365 (15 Enero 2025): VENCIMIENTO
┌─────────────────────────────────────────────────────────────┐
│ REVISIÓN VENCIDA                                            │
│                                                              │
│ Tarea Celery:                                               │
│ - Estado: PROXIMO_VENCIMIENTO → VENCIDA                     │
│ - Notificaciones CRITICAS                                   │
│ - Si es política crítica → Escalar a directivos             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
OPCIONES:
    │
    ├─ OPCIÓN A: INICIAR REVISIÓN
    │  POST /configuracion-revision/1/iniciar-revision/
    │  → Estado: VENCIDA → EN_REVISION
    │  → Usuario revisa y actualiza
    │  → POST /configuracion-revision/1/completar-revision/
    │  → proxima_revision = HOY + 365 días
    │  → Estado: EN_REVISION → VIGENTE
    │
    └─ OPCIÓN B: AUTO-RENOVACIÓN
       → auto_renovar = True
       → Mantiene versión actual
       → proxima_revision = HOY + 365 días
       → Estado: VENCIDA → VIGENTE
```

### 6.3. Tareas Celery (Programadas)

**Ubicación**: `backend/apps/gestion_estrategica/identidad/tasks_workflow.py`

```python
"""
Tareas asíncronas Celery para workflow de firmas y revisiones.
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.gestion_estrategica.identidad.models import (
    ConfiguracionRevision,
    FirmaDigital,
)


@shared_task
def verificar_firmas_vencidas():
    """
    Verifica firmas vencidas y notifica.

    Ejecuta: Diario 08:00 AM
    """
    from datetime import date

    firmas_vencidas = FirmaDigital.objects.filter(
        status='PENDIENTE',
        fecha_vencimiento__lt=date.today(),
        is_active=True
    )

    for firma in firmas_vencidas:
        firma.status = 'VENCIDO'
        firma.save()

        # Notificar firmante
        enviar_notificacion_firma_vencida(firma)


@shared_task
def verificar_revisiones_pendientes():
    """
    Verifica revisiones vencidas y actualiza estados.

    Ejecuta: Diario 09:00 AM
    """
    from datetime import date

    revisiones_vencidas = ConfiguracionRevision.objects.filter(
        habilitado=True,
        proxima_revision__lt=date.today(),
        estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO']
    )

    for config in revisiones_vencidas:
        config.estado = config.EstadoRevision.VENCIDA
        config.save()

        # Notificar responsable
        notificar_revision_vencida(config)

        # Escalar si es crítica
        if es_politica_critica(config):
            escalar_revision_vencida(config)


@shared_task
def enviar_alertas_revision():
    """
    Envía alertas de revisiones próximas a vencer.

    Ejecuta: Diario 10:00 AM
    """
    from datetime import date

    configuraciones = ConfiguracionRevision.objects.filter(
        habilitado=True,
        proxima_revision__gte=date.today()
    )

    for config in configuraciones:
        if config.debe_enviar_alerta():
            dias = config.dias_hasta_revision()

            # Prioridad según días
            if dias <= 7:
                prioridad = 'CRITICA'
            elif dias <= 15:
                prioridad = 'ALTA'
            else:
                prioridad = 'MEDIA'

            enviar_alerta_revision(config, dias, prioridad)


@shared_task
def actualizar_estados_revision():
    """
    Actualiza estados de configuraciones de revisión.

    Ejecuta: Diario 00:30 AM
    """
    configuraciones = ConfiguracionRevision.objects.filter(
        habilitado=True
    )

    for config in configuraciones:
        config.actualizar_estado()


@shared_task
def auto_renovar_politicas():
    """
    Auto-renueva políticas configuradas con auto_renovar=True.

    Ejecuta: Semanal (lunes 08:00 AM)
    """
    from datetime import date, timedelta

    configs_auto_renovar = ConfiguracionRevision.objects.filter(
        habilitado=True,
        auto_renovar=True,
        estado='VENCIDA'
    )

    for config in configs_auto_renovar:
        # Verificar que no hay cambios pendientes
        if no_tiene_cambios_pendientes(config):
            # Renovar automáticamente
            config.ultima_revision = date.today()
            config.proxima_revision = calcular_proxima_revision(config)
            config.estado = config.EstadoRevision.VIGENTE
            config.save()

            # Crear historial
            crear_historial_renovacion_automatica(config)

            # Notificar
            notificar_renovacion_automatica(config)


def calcular_proxima_revision(config):
    """Calcula la próxima fecha de revisión."""
    from datetime import date, timedelta

    if config.frecuencia == 'ANUAL':
        return date.today() + timedelta(days=365)
    elif config.frecuencia == 'SEMESTRAL':
        return date.today() + timedelta(days=180)
    elif config.frecuencia == 'TRIMESTRAL':
        return date.today() + timedelta(days=90)
    elif config.frecuencia == 'BIANUAL':
        return date.today() + timedelta(days=730)
    elif config.frecuencia == 'PERSONALIZADO':
        return date.today() + timedelta(days=config.dias_personalizados)

    return date.today() + timedelta(days=365)
```

**Configuración en `celery.py`:**

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'verificar-firmas-vencidas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_firmas_vencidas',
        'schedule': crontab(hour=8, minute=0),
    },
    'verificar-revisiones-pendientes': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_revisiones_pendientes',
        'schedule': crontab(hour=9, minute=0),
    },
    'enviar-alertas-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.enviar_alertas_revision',
        'schedule': crontab(hour=10, minute=0),
    },
    'actualizar-estados-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.actualizar_estados_revision',
        'schedule': crontab(hour=0, minute=30),
    },
    'auto-renovar-politicas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.auto_renovar_politicas',
        'schedule': crontab(day_of_week='monday', hour=8, minute=0),
    },
}
```

---

## 7. Implementación Frontend React

### 7.1. Instalación de Dependencias

```bash
npm install react-signature-canvas
npm install diff
npm install date-fns
npm install recharts
npm install @types/react-signature-canvas --save-dev
```

### 7.2. Componente Canvas de Firma

**Ubicación**: `frontend/src/components/forms/SignaturePad.tsx`

```tsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/Button';
import { Undo2, Trash2, Download, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SignaturePadProps {
  value?: string | null;
  onChange?: (signature: string | null) => void;
  required?: boolean;
  width?: number;
  height?: number;
  penColor?: string;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  disabled?: boolean;
  showDownload?: boolean;
  label?: string;
  error?: string;
  darkMode?: boolean;
}

export interface SignaturePadHandle {
  getSignature: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
  setSignature: (dataURL: string) => void;
  download: (filename?: string) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      value,
      onChange,
      required = false,
      width,
      height = 200,
      penColor,
      minWidth = 0.5,
      maxWidth = 2.5,
      className,
      disabled = false,
      showDownload = false,
      label,
      error,
      darkMode = false,
    },
    ref
  ) => {
    const signatureRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [hasChanged, setHasChanged] = useState(false);
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [canvasWidth, setCanvasWidth] = useState(width || 500);

    // Auto-detect container width
    useEffect(() => {
      if (!width && containerRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const newWidth = entry.contentRect.width;
            if (newWidth > 0) {
              setCanvasWidth(newWidth);
            }
          }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
    }, [width]);

    // Cargar firma inicial
    useEffect(() => {
      if (value && signatureRef.current && !hasChanged) {
        try {
          signatureRef.current.fromDataURL(value);
          setIsEmpty(false);
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    }, [value, hasChanged]);

    useImperativeHandle(ref, () => ({
      getSignature: () => {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
          return null;
        }
        return signatureRef.current.toDataURL('image/png');
      },
      clear: handleClear,
      isEmpty: () => isEmpty,
      setSignature: (dataURL: string) => {
        if (signatureRef.current) {
          signatureRef.current.fromDataURL(dataURL);
          setIsEmpty(false);
          setHasChanged(true);
        }
      },
      download: handleDownload,
    }));

    const handleBegin = () => {
      if (signatureRef.current) {
        const currentData = signatureRef.current.toDataURL();
        setUndoStack((prev) => [...prev, currentData].slice(-10));
      }
    };

    const handleEnd = () => {
      if (signatureRef.current) {
        const newIsEmpty = signatureRef.current.isEmpty();
        setIsEmpty(newIsEmpty);
        setHasChanged(true);

        if (!newIsEmpty) {
          const signature = signatureRef.current.toDataURL('image/png');
          onChange?.(signature);
        } else {
          onChange?.(null);
        }
      }
    };

    const handleClear = () => {
      if (signatureRef.current) {
        signatureRef.current.clear();
        setIsEmpty(true);
        setHasChanged(true);
        setUndoStack([]);
        onChange?.(null);
      }
    };

    const handleUndo = () => {
      if (undoStack.length > 0 && signatureRef.current) {
        const previousState = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));

        if (previousState) {
          signatureRef.current.fromDataURL(previousState);
        } else {
          signatureRef.current.clear();
        }

        setIsEmpty(signatureRef.current.isEmpty());
        setHasChanged(true);

        const signature = signatureRef.current.isEmpty()
          ? null
          : signatureRef.current.toDataURL('image/png');
        onChange?.(signature);
      }
    };

    const handleDownload = (filename?: string) => {
      if (signatureRef.current && !isEmpty) {
        const dataURL = signatureRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename || `firma_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
      }
    };

    const effectivePenColor = penColor || (darkMode ? '#ffffff' : '#000000');
    const backgroundColor = darkMode ? '#1f2937' : '#ffffff';

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          ref={containerRef}
          className={cn(
            'border-2 rounded-lg overflow-hidden transition-colors',
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ backgroundColor }}
        >
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: canvasWidth,
              height: height,
              className: 'touch-none',
              style: { width: '100%', height: `${height}px` },
            }}
            penColor={effectivePenColor}
            minWidth={minWidth}
            maxWidth={maxWidth}
            onBegin={handleBegin}
            onEnd={handleEnd}
            clearOnResize={false}
            velocityFilterWeight={0.7}
            throttle={16}
            minDistance={3}
            dotSize={1}
            backgroundColor={backgroundColor}
          />
        </div>

        {/* Toolbar */}
        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Deshacer"
            >
              <Undo2 className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
              title="Limpiar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {showDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownload()}
                disabled={isEmpty}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {!isEmpty && (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400 ml-auto">
                <Check className="h-4 w-4 mr-1" />
                <span>Firmado</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {required && isEmpty && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Firma requerida. Por favor, firme en el espacio superior.
          </p>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
```

### 7.3. Hook personalizado useFirmaDigital

**Ubicación**: `frontend/src/hooks/useFirmaDigital.ts`

```tsx
import { useState } from 'react';
import axios from 'axios';

const API_BASE = '/api/gestion-estrategica/identidad/workflow';

export const useFirmaDigital = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firmarDocumento = async (
    firmaId: number,
    firmaBase64: string,
    observaciones?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/firmar/`,
        {
          firma_base64: firmaBase64,
          observaciones
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al firmar documento';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const rechazarFirma = async (firmaId: number, motivo: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/rechazar/`,
        { motivo }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al rechazar firma';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const delegarFirma = async (
    firmaId: number,
    nuevoFirmanteId: number,
    motivo: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/delegar/`,
        {
          nuevo_firmante_id: nuevoFirmanteId,
          motivo
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al delegar firma';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const obtenerFirmasPendientes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE}/firmas-digitales/mis-firmas-pendientes/`
      );

      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || 'Error al obtener firmas pendientes';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verificarIntegridad = async (firmaId: number) => {
    try {
      const response = await axios.get(
        `${API_BASE}/firmas-digitales/${firmaId}/verificar-integridad/`
      );

      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || 'Error al verificar integridad';
      throw new Error(errorMsg);
    }
  };

  return {
    loading,
    error,
    firmarDocumento,
    rechazarFirma,
    delegarFirma,
    obtenerFirmasPendientes,
    verificarIntegridad
  };
};
```

### 7.4. Modal de Firma Digital

**Ubicación**: `frontend/src/components/FirmaDigitalModal.tsx`

```tsx
import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, Save } from 'lucide-react';
import { useFirmaDigital } from '../hooks/useFirmaDigital';

interface FirmaDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmaId: number;
  rolFirma: string;
  documentoNombre: string;
  onSuccess: () => void;
}

export const FirmaDigitalModal: React.FC<FirmaDigitalModalProps> = ({
  isOpen,
  onClose,
  firmaId,
  rolFirma,
  documentoNombre,
  onSuccess
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [observaciones, setObservaciones] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);
  const { firmarDocumento, loading, error } = useFirmaDigital();

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, firme antes de guardar');
      return;
    }

    try {
      const firmaBase64 = sigCanvas.current.toDataURL('image/png');
      await firmarDocumento(firmaId, firmaBase64, observaciones);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al firmar:', err);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="modal-container max-w-3xl w-full bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="modal-header flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Firma Digital - {rolFirma}</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body p-6">
          {/* Documento Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Documento:</strong> {documentoNombre}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Rol:</strong> {rolFirma}
            </p>
          </div>

          {/* Canvas de Firma */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Firma Manuscrita *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: 700,
                  height: 200,
                  className: 'signature-canvas w-full'
                }}
                onBegin={() => setIsEmpty(false)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Firme con el mouse o pantalla táctil en el área superior
            </p>
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Ej: Aprobado según criterios técnicos y normativos"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2 px-4 py-2"
              disabled={isEmpty || loading}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Firmar Documento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 8. Casos de Uso Específicos

### 8.1. Firma de Política SST con Workflow Secuencial

**Actor**: Coordinador SST, Gerente HSEQ, Gerente General

**Flujo**:
1. Coordinador SST crea Política Específica SST
2. Aplica workflow predefinido "Workflow Política SST"
3. Sistema crea 3 firmas en orden secuencial
4. Coordinador SST firma como "Elaboró"
5. Sistema notifica automáticamente a Gerente HSEQ
6. Gerente HSEQ revisa y firma como "Revisó"
7. Sistema notifica a Gerente General
8. Gerente General firma como "Aprobó"
9. Sistema cambia estado de política a VIGENTE
10. Configura revisión anual automática

### 8.2. Delegar Firma por Ausencia

**Actor**: Gerente HSEQ

**Flujo**:
1. Gerente HSEQ recibe notificación de firma pendiente
2. Usuario accede al documento
3. Selecciona opción "Delegar Firma"
4. Busca y selecciona a Coordinador HSEQ Suplente
5. Ingresa motivo: "Vacaciones del 15 al 30 de enero"
6. Sistema registra delegación con trazabilidad completa
7. Notifica al suplente por email + in-app
8. Suplente firma en representación
9. Historial muestra: delegado_por + firmante_actual

### 8.3. Revisión Anual Automática

**Actor**: Sistema (Celery)

**Flujo**:
1. Tarea diaria verifica configuraciones de revisión
2. Detecta política SST con vencimiento en 30 días
3. Envía alerta EMAIL + IN_APP a responsable y creador
4. Día 350: envía segunda alerta (prioridad ALTA)
5. Día 358: envía tercera alerta (prioridad CRITICA + SMS)
6. Día 365: cambia estado a VENCIDA
7. Responsable recibe notificación crítica
8. Responsable inicia revisión desde dashboard
9. Actualiza contenido de política si hay cambios
10. Sistema aplica nuevo workflow de firmas
11. Al completar firmas: proxima_revision = HOY + 365 días

### 8.4. Comparar Versiones de Política

**Actor**: Auditor Interno

**Flujo**:
1. Auditor accede a página de política
2. Navega a tab "Historial de Versiones"
3. Selecciona versión 1.5 y versión 2.0
4. Click en "Comparar Versiones"
5. Sistema muestra diff detallado:
   - Campos agregados (verde)
   - Campos eliminados (rojo)
   - Campos modificados (amarillo con antes/después)
6. Auditor verifica que cambios cumplen normativa
7. Opcionalmente descarga reporte de cambios en PDF

---

## 9. Configuración y Despliegue

### 9.1. Configuración Backend

**`settings.py`**:

```python
# Celery Configuration
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Bogota'

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'Sistema StrateKaz <noreply@stratekaz.com>'

# Storage Configuration (S3 opcional)
if not DEBUG:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_ENCRYPTION = True
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Frontend URL (para links en emails)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
```

### 9.2. Iniciar Servicios

```bash
# Backend
python manage.py migrate
python manage.py runserver

# Celery Worker
celery -A config worker -l info

# Celery Beat (scheduler)
celery -A config beat -l info

# Flower (monitor web opcional)
celery -A config flower

# Frontend
cd frontend
npm run dev
```

### 9.3. Variables de Entorno (.env)

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stratekaz

# Redis
REDIS_URL=redis://localhost:6379/0

# Email
EMAIL_HOST_USER=noreply@stratekaz.com
EMAIL_HOST_PASSWORD=your-email-password

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=stratekaz-signatures
AWS_S3_REGION_NAME=us-east-1

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 10. Testing y Calidad

### 10.1. Tests Backend (pytest-django)

**Ubicación**: `backend/apps/core/tests/test_signature.py`

```python
import pytest
import base64
from io import BytesIO
from PIL import Image
from django.contrib.auth import get_user_model
from apps.core.models.signature import DigitalSignature

User = get_user_model()


@pytest.fixture
def signature_base64():
    """Genera firma Base64 de prueba."""
    img = Image.new('RGB', (400, 200), color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


@pytest.mark.django_db
class TestDigitalSignature:

    def test_create_signature_from_base64(self, empresa, user, signature_base64):
        """Test creación de firma desde Base64."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            created_by=user
        )

        assert signature.id is not None
        assert signature.signer == user
        assert signature.signature_hash is not None
        assert len(signature.signature_hash) == 64  # SHA-256

    def test_signature_hash_calculation(self, empresa, user, signature_base64):
        """Test cálculo de hash SHA-256."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        original_hash = signature.signature_hash
        recalculated_hash = signature.calculate_hash()
        assert original_hash == recalculated_hash

    def test_signature_integrity_verification(self, empresa, user, signature_base64):
        """Test verificación de integridad."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        is_valid = signature.verify_integrity()
        assert is_valid is True
        assert signature.is_verified is True

    def test_signature_integrity_fails_on_modification(
        self, empresa, user, signature_base64
    ):
        """Test que falla si se modifica la firma."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        # Modificar firma (simular manipulación)
        signature.signature_base64 = "modified_data"

        # Verificación debe fallar
        is_valid = signature.verify_integrity()
        assert is_valid is False
```

### 10.2. Checklist de Calidad

#### Backend
- [ ] Modelos creados con índices optimizados
- [ ] Migraciones aplicadas y versionadas
- [ ] Serializers con validaciones completas
- [ ] ViewSets con permisos correctos
- [ ] Tareas Celery configuradas y probadas
- [ ] Tests unitarios (>80% cobertura)
- [ ] Tests de integración para workflows
- [ ] Documentación API completa (OpenAPI/Swagger)

#### Frontend
- [ ] Componente SignaturePad funcional en móvil
- [ ] Modal de firma con UX optimizada
- [ ] Hook useFirmaDigital con manejo de errores
- [ ] Lista de firmas pendientes con filtros
- [ ] Visor de versiones con comparación visual
- [ ] Notificaciones en tiempo real
- [ ] Responsive design en todos los componentes
- [ ] Tests E2E para flujos críticos

#### DevOps
- [ ] Docker Compose configurado
- [ ] Redis funcionando para Celery
- [ ] Celery Worker y Beat ejecutándose
- [ ] Backups automáticos de BD
- [ ] Monitoring con Sentry/Datadog
- [ ] CI/CD pipeline configurado
- [ ] SSL/TLS en producción
- [ ] Variables de entorno seguras

---

## Seguridad y Consideraciones

### Seguridad de Firmas

1. **Hash SHA-256**: Verificación de integridad inmutable
2. **Metadatos**: IP, timestamp, user agent registrados
3. **Encriptación**: HTTPS obligatorio en producción
4. **Acceso**: Solo firmante asignado puede firmar
5. **Auditoría**: Logs completos de todas las acciones

### Rendimiento

1. **Almacenamiento**: Base64 para <100KB, archivo para >100KB
2. **Índices**: Optimizados en BD para consultas frecuentes
3. **Cache**: Redis para tareas Celery y sesiones
4. **CDN**: S3/CloudFront para firmas en archivo
5. **Lazy Loading**: Componentes frontend con React.lazy

### Escalabilidad

1. **Multi-tenant**: Aislamiento por esquema/empresa
2. **Horizontal**: Workers Celery escalables
3. **Vertical**: Pooling de conexiones BD
4. **Async**: Tareas pesadas en background
5. **Monitoring**: Métricas de performance y errores

---

## Referencias y Documentación

### Librerías
- [react-signature-canvas](https://www.npmjs.com/package/react-signature-canvas)
- [signature_pad](https://www.npmjs.com/package/signature_pad)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery](https://docs.celeryq.dev/)

### Normativas
- [ISO 9001:2015](https://www.iso.org/iso-9001-quality-management.html)
- [ISO 45001:2018](https://www.iso.org/iso-45001-occupational-health-and-safety.html)
- [Decreto 1072/2015 Colombia](https://www.mintrabajo.gov.co/documents/20147/0/DUR+Sector+Trabajo+Actualizado+a+15+de+abril++de+2016.pdf)

### Soporte
- Email: soporte@stratekaz.com
- Documentación: https://docs.stratekaz.com/workflow-firmas
- Issues: https://github.com/stratekaz/issues

---

**Versión**: 2.0.0
**Fecha**: 2026-02-06
**Autor**: Equipo de Arquitectura StrateKaz
**Cumplimiento**: ISO 9001, ISO 45001, ISO 14001, ISO 27001, Decreto 1072/2015
