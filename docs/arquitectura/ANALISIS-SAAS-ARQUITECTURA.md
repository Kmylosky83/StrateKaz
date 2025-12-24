# ANALISIS ARQUITECTURA SAAS - Grasas y Huesos del Norte SGI

**Fecha de Análisis:** 17 Diciembre 2025
**Versión Sistema:** 1.0.0-beta.2
**Analista:** SAAS Architect - Colombia Edition

---

## RESUMEN EJECUTIVO

### Estado Actual del Proyecto

**Grasas y Huesos del Norte SGI** es un **sistema monolítico de gestión interna** diseñado para una empresa específica de recolección y procesamiento de materias primas en Colombia. **NO es actualmente un SaaS multi-tenant**.

**Características Actuales:**
- Sistema de gestión integral (SGI) vertical para una sola empresa
- Arquitectura monolítica tradicional (Django + React)
- Base de datos única compartida sin multi-tenancy
- RBAC robusto con roles, permisos y cargos dinámicos
- Sin funcionalidades de suscripción, billing o pagos
- Diseñado para uso interno corporativo

**Potencial SaaS:** ⭐⭐⭐⭐ (4/5)
El sistema tiene una **arquitectura sólida y modular** que puede convertirse en SaaS con modificaciones significativas.

---

## 1. MULTI-TENANCY 🏢

### Estado Actual: ❌ NO IMPLEMENTADO

**Arquitectura Actual:**
```
┌─────────────────────────────────────────────┐
│        Base de Datos Única (MySQL)          │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  Todos los datos mezclados          │   │
│  │  Sin segregación por tenant         │   │
│  │  Sin campo tenant_id/company_id     │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  EmpresaConfig (Singleton)                  │
│  └─ Solo permite 1 empresa en el sistema    │
└─────────────────────────────────────────────┘
```

**Evidencia:**
```python
# C:\Proyectos\Grasas y Huesos del Norte\backend\apps\gestion_estrategica\configuracion\models.py
# Líneas 147-444

class EmpresaConfig(models.Model):
    """
    Configuración de Datos Fiscales y Legales de la Empresa

    Modelo Singleton: Solo puede existir un registro en la base de datos.
    """

    def save(self, *args, **kwargs):
        # Si ya existe un registro y no es este, lanzar error
        existing = EmpresaConfig.objects.exclude(pk=self.pk).first()
        if existing:
            raise ValidationError(
                'Ya existe una configuración de empresa. '
                'Solo puede haber un registro.'
            )
```

**Modelo Usuario (Sin tenant):**
```python
# backend/apps/core/models.py - Línea 508+
class User(AbstractUser):
    """Usuario personalizado - SIN campo company/tenant"""

    # Campos de identificación
    document_type = models.CharField(...)
    document_number = models.CharField(...)

    # Datos laborales INTERNOS
    cargo = models.ForeignKey('Cargo', ...)  # Cargo dentro de LA empresa
    sede = models.ForeignKey('SedeEmpresa', ...)  # Sede de LA empresa

    # NO TIENE: company_id, tenant_id, organization_id
```

### Problemas para Multi-Tenancy:

1. **No hay concepto de "Cliente/Empresa Cliente"**
   - `EmpresaConfig` es singleton (solo 1 empresa)
   - No existe modelo `Company` o `Organization` para múltiples tenants
   - Todos los usuarios pertenecen a la misma organización

2. **Sin aislamiento de datos**
   - Ningún modelo tiene `company_id` o `tenant_id`
   - Las consultas no filtran por tenant
   - Riesgo alto de data leakage entre clientes

3. **Configuración global**
   - Branding, logos, colores son globales
   - No hay personalización por cliente

4. **Sedes de empresa como multi-sitio interno**
   ```python
   # SedeEmpresa es para múltiples sedes de LA MISMA empresa
   # NO es para múltiples empresas cliente
   class SedeEmpresa(models.Model):
       es_sede_principal = models.BooleanField(...)
       # Sedes de: Bogotá, Medellín, Cali de GRASAS Y HUESOS
       # NO: Empresa A, Empresa B, Empresa C (clientes)
   ```

### Recomendaciones Multi-Tenancy:

#### Opción 1: Schema-per-Tenant (Recomendado para Colombia)

**Ventajas:**
- Aislamiento total de datos
- Cumplimiento GDPR/Ley Habeas Data Colombia
- Backups independientes por cliente
- Mejor para consultoras que gestionan múltiples clientes

**Arquitectura:**
```
┌─────────────────────────────────────────────────────┐
│            Base de Datos MySQL                       │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  tenant_001  │  │  tenant_002  │  │  shared  │  │
│  │  (Cliente A) │  │  (Cliente B) │  │  (Core)  │  │
│  │              │  │              │  │          │  │
│  │  users       │  │  users       │  │  tenants │  │
│  │  recoleccion │  │  recoleccion │  │  plans   │  │
│  │  proveedores │  │  proveedores │  │  billing │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
```

**Implementación:**
```python
# backend/apps/core/tenant_middleware.py
from django.db import connection

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Determinar tenant por:
        # - Subdominio: cliente-a.grasasyhuesos.com
        # - Header: X-Tenant-ID
        # - Token JWT claim

        tenant_schema = self.get_tenant_from_request(request)

        # Cambiar schema de MySQL
        with connection.cursor() as cursor:
            cursor.execute(f"USE `{tenant_schema}`")

        request.tenant = tenant_schema
        response = self.get_response(request)
        return response
```

**Modelos a crear:**
```python
# backend/apps/core/models_saas.py

class Company(models.Model):
    """
    Empresa Cliente (Tenant)

    Casos de uso:
    1. Consultora que gestiona múltiples empresas cliente
    2. Profesional independiente con varios clientes
    3. Empresa que usa el sistema directamente
    """

    # Identificación
    code = models.CharField(max_length=50, unique=True, db_index=True)
    legal_name = models.CharField(max_length=250)
    nit = models.CharField(max_length=20, unique=True)

    # Tipo de cliente
    COMPANY_TYPE_CHOICES = [
        ('consultora', 'Empresa Consultora'),
        ('profesional', 'Profesional Independiente'),
        ('empresa_directa', 'Empresa Directa'),
        ('emprendedor', 'Emprendedor'),
    ]
    company_type = models.CharField(max_length=20, choices=COMPANY_TYPE_CHOICES)

    # Multi-tenancy
    schema_name = models.CharField(
        max_length=63,
        unique=True,
        help_text='Nombre del schema MySQL (ej: tenant_001)'
    )

    # Suscripción (agregar después)
    subscription = models.ForeignKey('Subscription', on_delete=models.SET_NULL, null=True)

    # Billing
    billing_email = models.EmailField()
    billing_phone = models.CharField(max_length=20)

    # Estado
    is_active = models.BooleanField(default=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    # Configuración
    max_users = models.IntegerField(default=10)
    storage_limit_gb = models.IntegerField(default=5)

    # Branding (por cliente)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'shared_companies'  # En schema "shared"
        verbose_name = 'Empresa Cliente'
        verbose_name_plural = 'Empresas Clientes'

    def create_schema(self):
        """Crea el schema de MySQL para este tenant"""
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.schema_name}`")

        # Aplicar migraciones al nuevo schema
        from django.core.management import call_command
        call_command('migrate', database=self.schema_name)

    def delete_schema(self):
        """Elimina el schema (usar con precaución)"""
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{self.schema_name}`")


class CompanyUser(models.Model):
    """
    Relación entre Usuario y Empresa Cliente

    Permite que un usuario:
    - Pertenezca a múltiples empresas (consultora con varios clientes)
    - Tenga diferentes roles por empresa
    """

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user = models.ForeignKey('User', on_delete=models.CASCADE)

    # Rol en esta empresa específica
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True)

    # Control de acceso
    is_active = models.BooleanField(default=True)
    can_switch_companies = models.BooleanField(default=True)

    # Auditoría
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shared_company_users'
        unique_together = [['company', 'user']]
```

#### Opción 2: Row-Level Tenancy (Más simple, menos seguro)

**Ventajas:**
- Más fácil de implementar
- Backups centralizados
- Queries más simples

**Desventajas:**
- Riesgo de data leakage
- Difícil de escalar (millones de registros)
- Menos seguridad regulatoria

**Implementación:**
```python
# Agregar company_id a TODOS los modelos
class Recoleccion(models.Model):
    company = models.ForeignKey(
        'Company',
        on_delete=models.CASCADE,
        db_index=True
    )
    # ... resto de campos

# Middleware para auto-filtrar
class TenantQueryMiddleware:
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Auto-agregar .filter(company=request.company) a todos los queries
        pass
```

---

## 2. SISTEMA DE SUSCRIPCIONES Y BILLING 💳

### Estado Actual: ❌ NO IMPLEMENTADO

**Evidencia:**
```bash
# Búsqueda en código
grep -ri "subscription\|billing\|payment\|plan" backend/
# Resultado: 0 modelos de suscripción encontrados

# No existe:
- Modelo Subscription
- Modelo Payment
- Modelo Invoice
- Modelo Plan/PricingTier
```

**Lo que SÍ existe:**
```python
# backend/apps/gestion_estrategica/configuracion/models.py
class IntegracionExterna(models.Model):
    """Integración con servicios externos"""

    PROVEEDOR_CHOICES = [
        # Pagos incluidos en opciones
        ('PAYU', 'PayU Latam'),
        ('MERCADOPAGO', 'MercadoPago'),
        ('STRIPE', 'Stripe'),
        ('WOMPI', 'Wompi'),  # ✅ Gateway colombiano
        ('EVERTEC', 'Evertec (PlacetoPay)'),
    ]

    # Soporte para encriptar credenciales
    _credenciales_encrypted = models.TextField(...)
```

**Conclusión:** El sistema tiene **preparación para integraciones** pero **cero funcionalidad de billing**.

### Recomendaciones Billing Colombia:

#### Pricing Tiers Sugeridos (Mercado Colombiano)

```python
# backend/apps/billing/pricing.py

from decimal import Decimal
from dataclasses import dataclass

@dataclass
class PlanFeatures:
    max_users: int
    max_ecoaliados: int
    max_storage_gb: int
    modules_included: list
    has_api_access: bool
    has_whitelabel: bool
    support_level: str

PRICING_PLANS = {
    'emprendedor': {
        'name': 'Emprendedor',
        'price_cop_monthly': Decimal('99000'),  # ~$25 USD
        'price_cop_annual': Decimal('990000'),  # 2 meses gratis
        'features': PlanFeatures(
            max_users=3,
            max_ecoaliados=50,
            max_storage_gb=5,
            modules_included=['recolecciones', 'proveedores', 'reportes_basicos'],
            has_api_access=False,
            has_whitelabel=False,
            support_level='email'
        ),
        'trial_days': 14,
    },

    'profesional': {
        'name': 'Profesional',
        'price_cop_monthly': Decimal('249000'),  # ~$62 USD
        'price_cop_annual': Decimal('2490000'),
        'features': PlanFeatures(
            max_users=10,
            max_ecoaliados=200,
            max_storage_gb=20,
            modules_included=['recolecciones', 'proveedores', 'programaciones',
                            'recepciones', 'lotes', 'liquidaciones', 'reportes_avanzados'],
            has_api_access=True,
            has_whitelabel=False,
            support_level='chat'
        ),
        'trial_days': 30,
    },

    'empresa': {
        'name': 'Empresa',
        'price_cop_monthly': Decimal('499000'),  # ~$125 USD
        'price_cop_annual': Decimal('4990000'),
        'features': PlanFeatures(
            max_users=30,
            max_ecoaliados=500,
            max_storage_gb=50,
            modules_included=['all'],
            has_api_access=True,
            has_whitelabel=True,
            support_level='phone_24_7'
        ),
        'trial_days': 30,
    },

    'consultora': {
        'name': 'Consultora (Multi-Cliente)',
        'price_cop_monthly': Decimal('999000'),  # ~$250 USD
        'price_cop_annual': Decimal('9990000'),
        'features': PlanFeatures(
            max_users=100,
            max_ecoaliados=-1,  # Ilimitado
            max_storage_gb=200,
            modules_included=['all'],
            has_api_access=True,
            has_whitelabel=True,
            support_level='dedicated_account_manager'
        ),
        'trial_days': 30,
        'multi_company': True,  # Puede gestionar múltiples empresas cliente
    },
}
```

#### Modelos de Billing (Propuesta)

```python
# backend/apps/billing/models.py

from django.db import models
from decimal import Decimal

class Subscription(models.Model):
    """Suscripción de una empresa"""

    STATUS_CHOICES = [
        ('trialing', 'En período de prueba'),
        ('active', 'Activa'),
        ('past_due', 'Pago vencido'),
        ('canceled', 'Cancelada'),
        ('unpaid', 'Impaga'),
    ]

    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Mensual'),
        ('annual', 'Anual'),
    ]

    company = models.OneToOneField('core.Company', on_delete=models.CASCADE)
    plan_code = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES)

    # Fechas
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    trial_end = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateField()

    # Precio
    current_price_cop = models.DecimalField(max_digits=12, decimal_places=2)

    # Cancelación
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_subscriptions'

    def is_trial(self):
        from django.utils import timezone
        return self.status == 'trialing' and self.trial_end and timezone.now() < self.trial_end


class Payment(models.Model):
    """Registro de pagos"""

    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('declined', 'Rechazado'),
        ('error', 'Error'),
        ('refunded', 'Reembolsado'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Tarjeta de Crédito'),
        ('debit_card', 'Tarjeta Débito'),
        ('pse', 'PSE (Transferencia Bancaria)'),
        ('nequi', 'Nequi'),
        ('daviplata', 'Daviplata'),
        ('efecty', 'Efecty'),
        ('baloto', 'Baloto'),
        ('bank_transfer', 'Transferencia Manual'),
    ]

    GATEWAY_CHOICES = [
        ('wompi', 'Wompi'),
        ('payu', 'PayU'),
        ('mercadopago', 'MercadoPago'),
        ('manual', 'Manual'),
    ]

    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE)

    # Montos
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    iva = models.DecimalField(max_digits=12, decimal_places=2)  # 19% en Colombia
    total = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='COP')

    # Pago
    reference = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES)
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    gateway_transaction_id = models.CharField(max_length=200, blank=True)

    # Estado
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'billing_payments'
        ordering = ['-created_at']


class Invoice(models.Model):
    """Factura electrónica DIAN"""

    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True)

    # Facturación DIAN
    invoice_number = models.CharField(max_length=50, unique=True)
    cufe = models.CharField(max_length=100, blank=True)  # Código DIAN

    # Montos
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    iva = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    # Documentos
    pdf_url = models.URLField(blank=True)
    xml_url = models.URLField(blank=True)

    # Fechas
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)

    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('sent', 'Enviada'),
        ('paid', 'Pagada'),
        ('overdue', 'Vencida'),
        ('void', 'Anulada'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'billing_invoices'
```

#### Integración Wompi (Gateway Colombiano Recomendado)

```python
# backend/apps/billing/gateways/wompi.py

import requests
import hmac
import hashlib
from django.conf import settings
from decimal import Decimal

class WompiGateway:
    """
    Integración con Wompi (Bancolombia)

    Soporta:
    - Tarjetas (crédito/débito)
    - PSE (transferencias bancarias)
    - Nequi (QR/deeplink)
    """

    def __init__(self):
        self.base_url = settings.WOMPI_BASE_URL
        self.public_key = settings.WOMPI_PUBLIC_KEY
        self.private_key = settings.WOMPI_PRIVATE_KEY
        self.events_secret = settings.WOMPI_EVENTS_SECRET

    def create_payment_link(self, amount_cop, reference, customer_email,
                           redirect_url):
        """
        Crea un link de pago Wompi

        Args:
            amount_cop: Monto en pesos colombianos
            reference: Referencia única del pago
            customer_email: Email del cliente
            redirect_url: URL de retorno después del pago

        Returns:
            dict: {success, checkout_url, payment_link_id}
        """

        # Convertir a centavos
        amount_cents = int(amount_cop * 100)

        payload = {
            "amount_in_cents": amount_cents,
            "currency": "COP",
            "customer_email": customer_email,
            "reference": reference,
            "redirect_url": redirect_url,
        }

        headers = {
            "Authorization": f"Bearer {self.public_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{self.base_url}/payment_links",
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "checkout_url": data["data"]["url"],
                "payment_link_id": data["data"]["id"],
            }

        return {"success": False, "error": response.json()}

    def verify_webhook_signature(self, payload, signature):
        """Verificar firma de webhook para seguridad"""

        concatenated = (
            f"{payload['event']}"
            f"{payload['data']['transaction']['id']}"
            f"{payload['data']['transaction']['status']}"
            f"{payload['data']['transaction']['amount_in_cents']}"
        )

        expected_signature = hmac.new(
            self.events_secret.encode(),
            concatenated.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)
```

---

## 3. ONBOARDING DE CLIENTES 🚀

### Estado Actual: ❌ NO IMPLEMENTADO

**Proceso Actual:**
- No hay flujo de registro self-service
- Usuarios creados manualmente por admin
- No hay wizard de configuración inicial
- No hay email de bienvenida automatizado

**Lo que existe:**
```python
# Sistema de autenticación básico
# backend/apps/core/views.py - Login/Logout
# frontend/src/features/auth/ - Formularios de login

# Pero NO:
- Registro público (signup)
- Verificación de email
- Setup wizard
- Plan selection
- Payment onboarding
```

### Recomendaciones Onboarding:

#### Flujo Propuesto (7 pasos)

```
┌─────────────────────────────────────────────────────┐
│  PASO 1: Registro (Signup)                          │
│  ├─ Email, contraseña                               │
│  ├─ Nombre empresa, NIT                             │
│  └─ Tipo de empresa (consultora/empresa/etc)        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 2: Verificación Email                         │
│  └─ Enviar código de verificación                   │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 3: Selección de Plan                          │
│  ├─ Emprendedor ($99k)                              │
│  ├─ Profesional ($249k)                             │
│  ├─ Empresa ($499k)                                 │
│  └─ Consultora ($999k)                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 4: Datos de Empresa (EmpresaConfig)           │
│  ├─ Razón social, NIT completo                      │
│  ├─ Dirección fiscal, ciudad, departamento          │
│  ├─ Representante legal                             │
│  └─ Régimen tributario (Común/Simple)               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 5: Configuración Inicial                      │
│  ├─ Logo empresa                                    │
│  ├─ Colores de marca                                │
│  ├─ Módulos a activar                               │
│  └─ Usuarios iniciales                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 6: Pago (si no es trial)                      │
│  ├─ Tarjeta crédito/débito                          │
│  ├─ PSE                                             │
│  └─ Nequi/Daviplata                                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASO 7: Welcome Dashboard                          │
│  ├─ Tour guiado del sistema                         │
│  ├─ Quick wins: Crear primer ecoaliado              │
│  └─ Centro de recursos/ayuda                        │
└─────────────────────────────────────────────────────┘
```

#### Implementación Frontend (React)

```typescript
// frontend/src/features/onboarding/OnboardingWizard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

interface OnboardingState {
  step: number;
  userData: {
    email: string;
    password: string;
    full_name: string;
  };
  companyData: {
    legal_name: string;
    nit: string;
    company_type: 'consultora' | 'empresa' | 'profesional' | 'emprendedor';
  };
  planData: {
    plan_code: string;
    billing_cycle: 'monthly' | 'annual';
  };
  configData: {
    logo?: File;
    primary_color: string;
    modules: string[];
  };
}

export function OnboardingWizard() {
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    userData: {} as any,
    companyData: {} as any,
    planData: {} as any,
    configData: { primary_color: '#3B82F6', modules: [] },
  });

  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: async (data: OnboardingState) => {
      // POST /api/onboarding/signup/
      const response = await fetch('/api/onboarding/signup/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirigir a dashboard
      navigate('/dashboard');
    },
  });

  const nextStep = () => {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const handleSubmit = () => {
    signupMutation.mutate(state);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-blue-600 h-2 transition-all"
          style={{ width: `${(state.step / 7) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-8">
        {state.step === 1 && (
          <SignupStep
            data={state.userData}
            onChange={(data) => setState(prev => ({ ...prev, userData: data }))}
            onNext={nextStep}
          />
        )}

        {state.step === 2 && (
          <EmailVerificationStep onNext={nextStep} />
        )}

        {state.step === 3 && (
          <PlanSelectionStep
            data={state.planData}
            onChange={(data) => setState(prev => ({ ...prev, planData: data }))}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 4 && (
          <CompanyDataStep
            data={state.companyData}
            onChange={(data) => setState(prev => ({ ...prev, companyData: data }))}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 5 && (
          <InitialConfigStep
            data={state.configData}
            onChange={(data) => setState(prev => ({ ...prev, configData: data }))}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {state.step === 6 && (
          <PaymentStep
            plan={state.planData}
            onNext={handleSubmit}
            onBack={prevStep}
          />
        )}

        {state.step === 7 && (
          <WelcomeStep />
        )}
      </div>
    </div>
  );
}
```

#### API Backend (Django)

```python
# backend/apps/onboarding/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import send_mail

class OnboardingViewSet(viewsets.ViewSet):
    """
    API de Onboarding para nuevos clientes
    """

    @action(detail=False, methods=['post'])
    def signup(self, request):
        """
        Registro completo de nuevo cliente (atomic)

        POST /api/onboarding/signup/
        {
          "userData": {...},
          "companyData": {...},
          "planData": {...},
          "configData": {...}
        }
        """

        try:
            with transaction.atomic():
                # 1. Crear Company (tenant)
                company = self._create_company(request.data['companyData'])

                # 2. Crear schema de MySQL para el tenant
                company.create_schema()

                # 3. Crear usuario admin del tenant
                user = self._create_user(
                    request.data['userData'],
                    company=company
                )

                # 4. Crear suscripción
                subscription = self._create_subscription(
                    company=company,
                    plan_data=request.data['planData']
                )

                # 5. Aplicar configuración inicial
                self._apply_initial_config(
                    company=company,
                    config_data=request.data['configData']
                )

                # 6. Enviar email de bienvenida
                self._send_welcome_email(user, company)

                # 7. Crear payment si no es trial
                if not subscription.is_trial():
                    payment_url = self._create_payment(
                        company=company,
                        subscription=subscription
                    )

                    return Response({
                        'success': True,
                        'requires_payment': True,
                        'payment_url': payment_url,
                    })

                # 8. Login automático
                tokens = self._generate_jwt_tokens(user)

                return Response({
                    'success': True,
                    'user': UserSerializer(user).data,
                    'company': CompanySerializer(company).data,
                    'tokens': tokens,
                })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def _create_company(self, data):
        """Crear empresa cliente"""
        from apps.core.models_saas import Company

        # Generar schema name único
        schema_name = f"tenant_{Company.objects.count() + 1:04d}"

        company = Company.objects.create(
            legal_name=data['legal_name'],
            nit=data['nit'],
            company_type=data['company_type'],
            schema_name=schema_name,
            is_active=True,
        )

        return company

    def _create_subscription(self, company, plan_data):
        """Crear suscripción inicial"""
        from apps.billing.models import Subscription
        from apps.billing.pricing import PRICING_PLANS
        from django.utils import timezone
        from datetime import timedelta

        plan = PRICING_PLANS[plan_data['plan_code']]

        # Calcular trial end
        trial_end = timezone.now() + timedelta(days=plan['trial_days'])

        subscription = Subscription.objects.create(
            company=company,
            plan_code=plan_data['plan_code'],
            status='trialing',
            billing_cycle=plan_data['billing_cycle'],
            current_period_start=timezone.now(),
            current_period_end=trial_end,
            trial_end=trial_end,
            next_billing_date=(trial_end + timedelta(days=1)).date(),
            current_price_cop=plan[f"price_cop_{plan_data['billing_cycle']}"],
        )

        return subscription

    def _send_welcome_email(self, user, company):
        """Enviar email de bienvenida"""

        send_mail(
            subject=f"Bienvenido a Grasas y Huesos SGI - {company.legal_name}",
            message=f"""
            Hola {user.first_name},

            ¡Bienvenido a Grasas y Huesos del Norte SGI!

            Tu cuenta ha sido creada exitosamente.
            Empresa: {company.legal_name}
            Plan: {company.subscription.get_plan_code_display()}

            Tu período de prueba termina el: {company.subscription.trial_end.strftime('%d/%m/%Y')}

            Accede a tu panel: https://app.grasasyhuesos.com/login

            Equipo Grasas y Huesos
            """,
            from_email='noreply@grasasyhuesos.com',
            recipient_list=[user.email],
        )
```

---

## 4. SEGURIDAD Y AISLAMIENTO DE DATOS 🔒

### Estado Actual: ⚠️ PARCIAL (Monolítico seguro, no multi-tenant)

**Fortalezas Actuales:**

1. **Autenticación JWT robusta**
   ```python
   # backend/config/settings.py
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
       'REFRESH_TOKEN_LIFETIME': timedelta(minutes=1440),  # 24 horas
       'ROTATE_REFRESH_TOKENS': True,
       'BLACKLIST_AFTER_ROTATION': True,  # ✅ Token blacklist
       'UPDATE_LAST_LOGIN': True,
   }
   ```

2. **Sistema RBAC completo**
   ```python
   # backend/apps/core/permissions.py
   class RequirePermission(BasePermission):
       """Permission class basada en códigos de permisos"""

       def has_permission(self, request, view):
           # Verificar permisos por acción
           permission_code = view.permission_map.get(view.action)
           return request.user.has_permission(permission_code)
   ```

3. **Auditoría con django-auditlog**
   ```python
   # backend/requirements.txt
   django-auditlog==2.3.0  # ✅ Log de cambios en modelos
   ```

4. **Encriptación de credenciales**
   ```python
   # backend/apps/gestion_estrategica/configuracion/models.py
   from cryptography.fernet import Fernet

   class IntegracionExterna(models.Model):
       _credenciales_encrypted = models.TextField(...)

       @property
       def credenciales(self):
           fernet = Fernet(get_encryption_key())
           return fernet.decrypt(self._credenciales_encrypted.encode())
   ```

**Debilidades para Multi-Tenant:**

1. **Sin aislamiento de datos**
   - No hay filtros por tenant en queries
   - Cualquier usuario podría acceder a datos de "otros clientes" (si existieran)

2. **Sin rate limiting**
   - No hay protección contra abuso de API
   - Un tenant podría consumir todos los recursos

3. **Sin segregación de backups**
   - Backup monolítico
   - No se pueden restaurar empresas individuales

### Recomendaciones Seguridad Multi-Tenant:

#### 1. Middleware de Tenant Context

```python
# backend/apps/core/middleware/tenant.py

from django.http import JsonResponse
from apps.core.models_saas import Company

class TenantMiddleware:
    """
    Middleware para establecer contexto de tenant en cada request
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Determinar tenant
        tenant = self._get_tenant(request)

        if not tenant:
            return JsonResponse({'error': 'Tenant not found'}, status=404)

        # Validar que tenant esté activo
        if not tenant.is_active:
            return JsonResponse({'error': 'Account suspended'}, status=403)

        # Validar suscripción
        if tenant.subscription and not tenant.subscription.is_active():
            return JsonResponse({'error': 'Subscription expired'}, status=402)

        # Establecer tenant en request
        request.tenant = tenant
        request.tenant_schema = tenant.schema_name

        # Cambiar schema de MySQL
        self._switch_schema(tenant.schema_name)

        response = self.get_response(request)
        return response

    def _get_tenant(self, request):
        """
        Obtener tenant desde:
        1. Subdominio: cliente-a.grasasyhuesos.com
        2. Header: X-Tenant-ID
        3. JWT claim: tenant_id
        """

        # Opción 1: Desde subdominio
        host = request.get_host()
        subdomain = host.split('.')[0]

        company = Company.objects.filter(code=subdomain).first()
        if company:
            return company

        # Opción 2: Desde header
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id:
            return Company.objects.filter(code=tenant_id).first()

        # Opción 3: Desde JWT
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Obtener primer company del usuario
            return request.user.companies.first()

        return None

    def _switch_schema(self, schema_name):
        """Cambiar schema de MySQL"""
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(f"USE `{schema_name}`")
```

#### 2. QuerySet con auto-filtro por Tenant

```python
# backend/apps/core/managers.py

from django.db import models
from django.db.models import Q

class TenantAwareManager(models.Manager):
    """
    Manager que auto-filtra por tenant actual
    """

    def get_queryset(self):
        from django.utils import threadlocal

        qs = super().get_queryset()

        # Obtener tenant del request actual (via threadlocal)
        request = threadlocal.get_current_request()

        if request and hasattr(request, 'tenant'):
            # Auto-filtrar por tenant
            if hasattr(self.model, 'company'):
                qs = qs.filter(company=request.tenant)

        return qs

# Uso en modelos
class Recoleccion(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    # ... campos

    objects = TenantAwareManager()  # Manager con auto-filtro
    all_objects = models.Manager()  # Manager sin filtro (para admin)
```

#### 3. Rate Limiting por Tenant

```python
# backend/apps/core/throttling.py

from rest_framework.throttling import UserRateThrottle

class TenantRateThrottle(UserRateThrottle):
    """
    Rate limiting por tenant

    Límites:
    - Emprendedor: 100 req/hora
    - Profesional: 500 req/hora
    - Empresa: 2000 req/hora
    - Consultora: 10000 req/hora
    """

    def get_cache_key(self, request, view):
        if not request.tenant:
            return None

        # Key único por tenant
        return f"throttle_tenant_{request.tenant.id}"

    def get_rate(self):
        """Obtener rate según plan del tenant"""

        if not hasattr(self, 'request'):
            return '100/hour'

        plan_rates = {
            'emprendedor': '100/hour',
            'profesional': '500/hour',
            'empresa': '2000/hour',
            'consultora': '10000/hour',
        }

        plan_code = self.request.tenant.subscription.plan_code
        return plan_rates.get(plan_code, '100/hour')

# Aplicar en ViewSets
class RecoleccionViewSet(viewsets.ModelViewSet):
    throttle_classes = [TenantRateThrottle]
```

#### 4. Backup por Tenant

```bash
#!/bin/bash
# backend/scripts/backup_tenant.sh

TENANT_SCHEMA=$1
BACKUP_DIR="/backups/tenants"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump \
  -u root \
  -p$MYSQL_ROOT_PASSWORD \
  --single-transaction \
  --databases $TENANT_SCHEMA \
  | gzip > "$BACKUP_DIR/${TENANT_SCHEMA}_${DATE}.sql.gz"

# Subir a S3 (opcional)
aws s3 cp \
  "$BACKUP_DIR/${TENANT_SCHEMA}_${DATE}.sql.gz" \
  "s3://grasasyhuesos-backups/tenants/$TENANT_SCHEMA/"

echo "Backup completado: ${TENANT_SCHEMA}_${DATE}.sql.gz"
```

---

## 5. ESCALABILIDAD 📈

### Estado Actual: ⚠️ LIMITADO (Monolítico, single instance)

**Arquitectura Actual:**
```
┌─────────────────────────────────────┐
│        Docker Compose (Mono)        │
│                                      │
│  ┌──────────┐  ┌─────────────────┐ │
│  │  MySQL   │  │  Django (1)     │ │
│  │  (1 DB)  │  │  Gunicorn       │ │
│  └──────────┘  └─────────────────┘ │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  React Frontend (Nginx)     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Limitaciones:**

1. **Single Point of Failure**
   - Si cae el contenedor, cae todo el sistema
   - No hay redundancia

2. **No horizontal scaling**
   - No se pueden agregar más instancias de Django
   - No load balancer

3. **Sin caché distribuido**
   - No Redis/Memcached
   - Cada request golpea la DB

4. **Sin workers asíncronos**
   - No Celery para tareas pesadas
   - Tareas largas bloquean requests

5. **Storage local**
   - Archivos en `/media/` dentro del contenedor
   - No S3 o almacenamiento distribuido

### Recomendaciones Escalabilidad:

#### Arquitectura SaaS Escalable (Propuesta)

```
                    ┌─────────────────────┐
                    │   Cloudflare CDN    │
                    │   (Cache estático)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer     │
                    │   (Nginx/AWS ALB)   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
   │  Django 1   │     │  Django 2   │     │  Django 3   │
   │  (API)      │     │  (API)      │     │  (API)      │
   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
   │   Redis     │     │   MySQL     │     │   Celery    │
   │   (Cache)   │     │   (Master)  │     │   Workers   │
   │             │     │             │     │   (async)   │
   └─────────────┘     └──────┬──────┘     └─────────────┘
                               │
                       ┌───────┴───────┐
                       │  MySQL Slaves │
                       │  (Read Only)  │
                       └───────────────┘
                               │
                       ┌───────▼───────┐
                       │   AWS S3      │
                       │   (Media)     │
                       └───────────────┘
```

#### Docker Compose Escalable

```yaml
# docker-compose.production.yml

version: '3.8'

services:
  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend1
      - backend2
      - backend3
    networks:
      - grasas_network

  # Django Backend (múltiples instancias)
  backend1:
    build: ./backend
    environment:
      - INSTANCE_ID=backend1
    volumes:
      - ./backend:/app
    depends_on:
      - db_master
      - redis
      - celery
    networks:
      - grasas_network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  backend2:
    build: ./backend
    environment:
      - INSTANCE_ID=backend2
    volumes:
      - ./backend:/app
    depends_on:
      - db_master
      - redis
      - celery
    networks:
      - grasas_network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  backend3:
    build: ./backend
    environment:
      - INSTANCE_ID=backend3
    volumes:
      - ./backend:/app
    depends_on:
      - db_master
      - redis
      - celery
    networks:
      - grasas_network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  # MySQL Master (escritura)
  db_master:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mysql_master_data:/var/lib/mysql
      - ./mysql/master.cnf:/etc/mysql/conf.d/master.cnf
    networks:
      - grasas_network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  # MySQL Slave 1 (lectura)
  db_slave1:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mysql_slave1_data:/var/lib/mysql
      - ./mysql/slave.cnf:/etc/mysql/conf.d/slave.cnf
    networks:
      - grasas_network

  # Redis (caché + sessions)
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - grasas_network

  # Celery Workers (tareas asíncronas)
  celery:
    build: ./backend
    command: celery -A config worker -l info --concurrency=4
    volumes:
      - ./backend:/app
    depends_on:
      - redis
      - db_master
    networks:
      - grasas_network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G

  # Celery Beat (tareas programadas)
  celery_beat:
    build: ./backend
    command: celery -A config beat -l info
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    networks:
      - grasas_network

volumes:
  mysql_master_data:
  mysql_slave1_data:
  redis_data:

networks:
  grasas_network:
    driver: bridge
```

#### Configuración Django para Escalabilidad

```python
# backend/config/settings_production.py

import os
from .settings import *

# ============================================
# CACHÉ (Redis)
# ============================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://redis:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Sessions en Redis (no en DB)
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ============================================
# BASE DE DATOS (Master-Slave)
# ============================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_MASTER_HOST'],  # Master para escritura
        'PORT': '3306',
    },
    'slave': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_SLAVE_HOST'],  # Slave para lectura
        'PORT': '3306',
    }
}

# Router para separar lectura/escritura
DATABASE_ROUTERS = ['apps.core.routers.MasterSlaveRouter']

# ============================================
# CELERY (Tareas asíncronas)
# ============================================

CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Bogota'

# ============================================
# STORAGE (AWS S3)
# ============================================

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')

# Servir archivos desde S3
MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/'

# ============================================
# SEGURIDAD
# ============================================

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

#### Database Router (Master-Slave)

```python
# backend/apps/core/routers.py

class MasterSlaveRouter:
    """
    Router para separar lecturas y escrituras

    - Escrituras → Master
    - Lecturas → Slave (con fallback a Master)
    """

    def db_for_read(self, model, **hints):
        """Lecturas van al slave"""
        return 'slave'

    def db_for_write(self, model, **hints):
        """Escrituras van al master"""
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """Permitir relaciones entre misma DB"""
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Migraciones solo en master"""
        return db == 'default'
```

#### Tareas Celery

```python
# backend/apps/billing/tasks.py

from celery import shared_task
from django.utils import timezone
from datetime import timedelta

@shared_task
def process_subscription_renewals():
    """
    Tarea programada: Procesar renovaciones de suscripciones
    Ejecutar diariamente a las 6 AM
    """

    from apps.billing.models import Subscription
    from apps.billing.services import SubscriptionService

    today = timezone.now().date()

    # Suscripciones que vencen hoy
    due_subscriptions = Subscription.objects.filter(
        status='active',
        next_billing_date=today
    )

    service = SubscriptionService()

    for subscription in due_subscriptions:
        try:
            service.renew_subscription(subscription)
        except Exception as e:
            # Log error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Error renovando suscripción {subscription.id}: {e}"
            )


@shared_task
def send_trial_ending_reminders():
    """
    Enviar recordatorios de trial próximo a vencer
    """

    from apps.billing.models import Subscription
    from django.core.mail import send_mail

    tomorrow = (timezone.now() + timedelta(days=1)).date()

    # Trials que vencen mañana
    expiring_trials = Subscription.objects.filter(
        status='trialing',
        trial_end__date=tomorrow
    )

    for subscription in expiring_trials:
        send_mail(
            subject='Tu período de prueba termina mañana',
            message=f'Hola, tu trial en {subscription.company.legal_name} termina mañana...',
            from_email='noreply@grasasyhuesos.com',
            recipient_list=[subscription.company.billing_email],
        )


@shared_task
def generate_invoice_pdf(invoice_id):
    """
    Generar PDF de factura (tarea pesada)
    """

    from apps.billing.models import Invoice
    from apps.billing.pdf_generator import InvoicePDFGenerator

    invoice = Invoice.objects.get(id=invoice_id)

    generator = InvoicePDFGenerator()
    pdf_url = generator.generate(invoice)

    invoice.pdf_url = pdf_url
    invoice.save()

    return pdf_url


# Programar tareas en Celery Beat
# backend/config/celery.py

from celery import Celery
from celery.schedules import crontab

app = Celery('grasas_huesos')
app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.beat_schedule = {
    'process-renewals-daily': {
        'task': 'apps.billing.tasks.process_subscription_renewals',
        'schedule': crontab(hour=6, minute=0),  # 6 AM diario
    },
    'trial-reminders-daily': {
        'task': 'apps.billing.tasks.send_trial_ending_reminders',
        'schedule': crontab(hour=9, minute=0),  # 9 AM diario
    },
}

app.autodiscover_tasks()
```

---

## 6. INTEGRACIONES DE PAGO COLOMBIANAS 💳

### Estado Actual: ⚠️ PREPARADO PERO NO IMPLEMENTADO

**Infraestructura Existente:**

```python
# backend/apps/gestion_estrategica/configuracion/models.py
# Líneas 856-1500

class IntegracionExterna(models.Model):
    """
    Sistema de integraciones con servicios externos

    ✅ Soporta configuración de gateways de pago
    ✅ Encriptación de credenciales con Fernet
    ✅ Monitoreo de salud de integraciones
    """

    PROVEEDOR_CHOICES = [
        # Pagos Colombia
        ('PAYU', 'PayU Latam'),
        ('MERCADOPAGO', 'MercadoPago'),
        ('WOMPI', 'Wompi'),  # Bancolombia
        ('EVERTEC', 'Evertec (PlacetoPay)'),
        ('STRIPE', 'Stripe'),
    ]

    # Credenciales encriptadas
    _credenciales_encrypted = models.TextField(...)

    @property
    def credenciales(self):
        """Desencriptar credenciales"""
        fernet = Fernet(get_encryption_key())
        return json.loads(
            fernet.decrypt(self._credenciales_encrypted.encode())
        )
```

**Pero NO hay:**
- Lógica de creación de pagos
- Webhooks de confirmación
- Generación de facturas DIAN
- Cálculo de IVA/retenciones

### Gateways Recomendados para Colombia:

#### 1. Wompi (Recomendado Principal)

**Ventajas:**
- Empresa colombiana (Bancolombia)
- Comisiones bajas: 2.99% + IVA tarjetas, 1.5% PSE
- Integración simple
- Soporta PSE, tarjetas, Nequi, QR Bancolombia
- Documentación en español

**Uso:**
```python
# Ver código completo en la sección de SAAS ARCHITECT al inicio
# backend/apps/billing/gateways/wompi.py

class WompiGateway:
    def create_payment_link(self, amount_cop, reference, customer_email):
        """Crear link de pago"""

    def create_pse_transaction(self, amount_cop, bank_code):
        """PSE (transferencia bancaria)"""

    def create_nequi_qr(self, amount_cop, phone_number):
        """QR de Nequi"""
```

#### 2. PayU (Backup)

**Ventajas:**
- Aceptado en toda Latinoamérica
- Soporta pagos recurrentes
- Más caro: 3.49% + IVA

**Uso:**
```python
class PayUGateway:
    def create_payment_form(self, amount_cop, reference):
        """Generar form de pago"""

        signature = hashlib.md5(
            f"{self.api_key}~{self.merchant_id}~{reference}~{amount_cop}~COP"
        ).hexdigest()

        return {
            "merchantId": self.merchant_id,
            "amount": amount_cop,
            "signature": signature,
            # ...
        }
```

#### 3. Facturación Electrónica DIAN

**Obligatorio en Colombia:**

```python
# backend/apps/billing/dian.py

class DIANInvoiceGenerator:
    """
    Generar facturas electrónicas conformes con DIAN
    """

    def generate_invoice(self, payment):
        """
        Generar factura con:
        - Número consecutivo
        - CUFE (Código Único de Factura Electrónica)
        - XML firmado digitalmente
        - PDF con QR
        """

        # 1. Generar número de factura
        invoice_number = self._get_next_invoice_number()

        # 2. Calcular IVA (19%)
        iva = payment.amount * Decimal('0.19')

        # 3. Calcular retenciones (si aplica)
        retencion_fuente = self._calculate_retencion_fuente(payment)
        retencion_ica = self._calculate_retencion_ica(payment)

        # 4. Generar CUFE
        cufe = self._generate_cufe(
            invoice_number,
            payment.company.nit,
            payment.total
        )

        # 5. Generar XML
        xml_content = self._generate_xml_ubl(
            invoice_number=invoice_number,
            company=payment.company,
            amount=payment.amount,
            iva=iva,
            total=payment.total,
            cufe=cufe
        )

        # 6. Firmar XML digitalmente
        signed_xml = self._sign_xml(xml_content)

        # 7. Enviar a DIAN
        dian_response = self._submit_to_dian(signed_xml)

        # 8. Generar PDF con QR
        pdf_url = self._generate_pdf(
            invoice_number=invoice_number,
            cufe=cufe,
            company=payment.company,
            items=payment.items
        )

        # 9. Guardar factura
        invoice = Invoice.objects.create(
            company=payment.company,
            payment=payment,
            invoice_number=invoice_number,
            cufe=cufe,
            xml_url=signed_xml_url,
            pdf_url=pdf_url,
            subtotal=payment.amount,
            iva=iva,
            retencion_fuente=retencion_fuente,
            retencion_ica=retencion_ica,
            total=payment.total,
            issue_date=timezone.now().date(),
            status='sent'
        )

        return invoice

    def _calculate_retencion_fuente(self, payment):
        """
        Retención en la fuente (si aplica)

        Solo si la empresa es:
        - Autorretenedor
        - O está sujeta a retención por ser gran contribuyente
        """

        if payment.company.subject_to_withholding:
            # Tarifa típica: 2.5% sobre base gravable
            return payment.amount * Decimal('0.025')

        return Decimal('0')

    def _calculate_retencion_ica(self, payment):
        """
        Retención ICA (Impuesto de Industria y Comercio)

        Solo aplica en algunas ciudades (ej: Bogotá)
        """

        if payment.company.city == 'Bogotá':
            # Bogotá: 0.966%
            return payment.amount * Decimal('0.00966')

        return Decimal('0')
```

---

## 7. METRICAS SAAS (MRR, ARR, CHURN) 📊

### Estado Actual: ❌ NO IMPLEMENTADO

**Lo que existe:**
- Reportes operacionales (recolecciones, proveedores)
- Dashboard básico con estadísticas internas
- Sin métricas de negocio SaaS

**Lo que NO existe:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate
- LTV (Customer Lifetime Value)
- CAC (Customer Acquisition Cost)
- Cohort Analysis
- Revenue Retention

### Métricas SaaS Recomendadas:

```python
# backend/apps/billing/metrics.py

from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

class SaaSMetrics:
    """Calculador de métricas SaaS"""

    def get_mrr(self):
        """
        Monthly Recurring Revenue (MRR)

        Ingresos recurrentes mensuales normalizados.
        """

        from apps.billing.models import Subscription
        from apps.billing.pricing import PRICING_PLANS

        active_subs = Subscription.objects.filter(status='active')

        mrr = Decimal('0')

        for sub in active_subs:
            plan = PRICING_PLANS[sub.plan_code]

            if sub.billing_cycle == 'monthly':
                mrr += plan['price_cop_monthly']
            else:  # annual
                # Normalizar anual a mensual
                mrr += plan['price_cop_annual'] / 12

        return mrr

    def get_arr(self):
        """Annual Recurring Revenue (ARR)"""
        return self.get_mrr() * 12

    def get_churn_rate(self, period_days=30):
        """
        Churn Rate - Tasa de cancelación

        Fórmula: (Clientes cancelados en período / Clientes al inicio) * 100
        """

        from apps.billing.models import Subscription

        period_start = timezone.now() - timedelta(days=period_days)

        # Clientes activos al inicio del período
        active_start = Subscription.objects.filter(
            created_at__lt=period_start,
            status='active'
        ).count()

        # Cancelados durante el período
        canceled = Subscription.objects.filter(
            canceled_at__gte=period_start,
            canceled_at__lt=timezone.now(),
            status='canceled'
        ).count()

        if active_start == 0:
            return 0.0

        churn = (canceled / active_start) * 100
        return round(churn, 2)

    def get_ltv(self):
        """
        Customer Lifetime Value (LTV)

        Fórmula: ARPU / Churn Rate Mensual
        """

        arpu = self.get_arpu()
        monthly_churn = Decimal(str(self.get_churn_rate())) / 100

        if monthly_churn == 0:
            return Decimal('0')

        ltv = arpu / monthly_churn
        return ltv

    def get_arpu(self):
        """
        Average Revenue Per User (ARPU)
        """

        from apps.billing.models import Subscription

        active_count = Subscription.objects.filter(status='active').count()

        if active_count == 0:
            return Decimal('0')

        return self.get_mrr() / active_count

    def get_revenue_retention(self, months_ago=1):
        """
        Net Revenue Retention (NRR)

        Mide si los clientes existentes aumentan o disminuyen su gasto.
        """

        from apps.billing.models import Subscription

        # MRR hace X meses
        date_past = timezone.now() - timedelta(days=months_ago * 30)

        # Clientes que estaban activos hace X meses
        cohort = Subscription.objects.filter(
            status='active',
            current_period_start__lte=date_past
        )

        # MRR de ese cohort en el pasado
        mrr_past = sum([
            self._get_subscription_mrr(sub, at_date=date_past)
            for sub in cohort
        ])

        # MRR del mismo cohort ahora
        mrr_now = sum([
            self._get_subscription_mrr(sub)
            for sub in cohort.filter(status='active')
        ])

        if mrr_past == 0:
            return 0.0

        nrr = (mrr_now / mrr_past) * 100
        return round(nrr, 2)

    def get_cohort_analysis(self, months=12):
        """
        Análisis de cohortes

        Agrupa clientes por mes de registro y sigue su retención.
        """

        from apps.billing.models import Subscription

        cohorts = []

        for month_offset in range(months):
            cohort_date = timezone.now() - timedelta(days=month_offset * 30)

            # Clientes que se registraron ese mes
            signups = Subscription.objects.filter(
                created_at__year=cohort_date.year,
                created_at__month=cohort_date.month
            ).count()

            # De esos, cuántos siguen activos
            still_active = Subscription.objects.filter(
                created_at__year=cohort_date.year,
                created_at__month=cohort_date.month,
                status='active'
            ).count()

            retention = (still_active / signups * 100) if signups > 0 else 0

            cohorts.append({
                'month': cohort_date.strftime('%Y-%m'),
                'signups': signups,
                'active': still_active,
                'retention': round(retention, 2)
            })

        return cohorts

    def get_dashboard_metrics(self):
        """
        Métricas para dashboard ejecutivo
        """

        return {
            'mrr': float(self.get_mrr()),
            'arr': float(self.get_arr()),
            'churn_rate': self.get_churn_rate(),
            'ltv': float(self.get_ltv()),
            'arpu': float(self.get_arpu()),
            'active_customers': self._get_active_customer_count(),
            'trial_customers': self._get_trial_customer_count(),
            'revenue_retention': self.get_revenue_retention(),
            'growth_rate': self._get_growth_rate(),
        }

    def _get_active_customer_count(self):
        from apps.billing.models import Subscription
        return Subscription.objects.filter(status='active').count()

    def _get_trial_customer_count(self):
        from apps.billing.models import Subscription
        return Subscription.objects.filter(status='trialing').count()

    def _get_growth_rate(self):
        """Crecimiento MoM (Month over Month)"""

        current_mrr = self.get_mrr()

        # MRR del mes pasado
        # (Simplificado - en producción usar histórico)
        last_month_mrr = current_mrr * Decimal('0.9')

        if last_month_mrr == 0:
            return 0.0

        growth = ((current_mrr - last_month_mrr) / last_month_mrr) * 100
        return round(float(growth), 2)
```

#### Dashboard API

```python
# backend/apps/billing/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAdminUser])
def saas_metrics_dashboard(request):
    """
    GET /api/billing/metrics/dashboard/

    Endpoint para dashboard de métricas SaaS (solo admin)
    """

    from apps.billing.metrics import SaaSMetrics

    metrics = SaaSMetrics()
    dashboard = metrics.get_dashboard_metrics()

    # Agregar cohort analysis
    dashboard['cohorts'] = metrics.get_cohort_analysis(months=12)

    return Response(dashboard)
```

---

## CONCLUSIONES Y ROADMAP 🚀

### Evaluación General

| Aspecto | Calificación | Comentario |
|---------|-------------|------------|
| **Multi-Tenancy** | 0/5 ❌ | No implementado. Singleton. |
| **Billing/Suscripciones** | 0/5 ❌ | No existe sistema de cobro. |
| **Onboarding** | 0/5 ❌ | No hay registro self-service. |
| **Seguridad** | 3/5 ⚠️ | JWT + RBAC robusto, pero sin tenant isolation. |
| **Escalabilidad** | 2/5 ⚠️ | Monolítico, sin horizontal scaling. |
| **Pagos Colombia** | 1/5 ⚠️ | Infraestructura preparada, sin implementación. |
| **Métricas SaaS** | 0/5 ❌ | Sin MRR, ARR, churn, LTV. |

**Calificación Total:** 6/35 (17%) ⚠️

### Fortalezas del Proyecto Actual

1. **RBAC robusto** - Sistema de permisos dinámico bien diseñado
2. **Arquitectura modular** - Apps Django bien separadas por dominio
3. **Frontend React moderno** - TypeScript, Tailwind, TanStack Query
4. **Encriptación de credenciales** - Fernet para datos sensibles
5. **Auditoría** - django-auditlog para trazabilidad
6. **Configuración dinámica** - Branding, integraciones configurables

### Debilidades para Convertir a SaaS

1. **Sin concepto de multi-company** - Todo diseñado para 1 empresa
2. **Base de datos compartida sin aislamiento** - Riesgo de data leakage
3. **No hay funcionalidad de billing** - Cero lógica de cobros
4. **Sin métricas de negocio** - No se puede medir éxito como SaaS
5. **Escalabilidad limitada** - Single instance, sin Redis/Celery
6. **Facturación DIAN no implementada** - Obligatorio en Colombia

---

## ROADMAP DE CONVERSION A SAAS 🗺️

### Fase 1: Fundamentos Multi-Tenant (3-4 meses)

#### Sprint 1-2: Modelos de Tenant (4 semanas)
- [ ] Crear modelo `Company` (tenant)
- [ ] Crear modelo `CompanyUser` (relación user-tenant)
- [ ] Migrar `EmpresaConfig` a modelo por tenant
- [ ] Agregar `company_id` a todos los modelos relevantes
- [ ] Implementar `TenantMiddleware`
- [ ] Crear `TenantAwareManager` para auto-filtrado

#### Sprint 3-4: Aislamiento de Datos (4 semanas)
- [ ] Implementar schema-per-tenant en MySQL
- [ ] Script de creación automática de schemas
- [ ] Migration runner para nuevos tenants
- [ ] Backups por tenant
- [ ] Tests de aislamiento de datos

#### Sprint 5-6: Multi-Company UX (4 semanas)
- [ ] Selector de empresa en frontend (para consultoras)
- [ ] Branding por tenant (logos, colores)
- [ ] Configuración por tenant
- [ ] Subdominios por tenant (cliente-a.app.com)

### Fase 2: Sistema de Billing (2-3 meses)

#### Sprint 7-8: Planes y Suscripciones (4 semanas)
- [ ] Modelo `Subscription`
- [ ] Modelo `Plan` con pricing tiers
- [ ] Lógica de trials (14-30 días)
- [ ] Restricciones por plan (users, storage, API calls)
- [ ] Upgrades/Downgrades
- [ ] Cancelaciones

#### Sprint 9: Pagos Wompi (2 semanas)
- [ ] Integración Wompi API
- [ ] Crear payment links
- [ ] PSE (transferencias)
- [ ] Tarjetas crédito/débito
- [ ] Nequi QR
- [ ] Webhooks de confirmación

#### Sprint 10: Facturación DIAN (2 semanas)
- [ ] Generación de facturas electrónicas
- [ ] Cálculo IVA (19%)
- [ ] Retenciones (fuente, ICA)
- [ ] XML UBL 2.1
- [ ] Firma digital
- [ ] Envío a DIAN
- [ ] PDF con QR

### Fase 3: Onboarding y UX (1-2 meses)

#### Sprint 11: Registro Self-Service (2 semanas)
- [ ] Wizard de 7 pasos
- [ ] Verificación de email
- [ ] Selección de plan
- [ ] Datos de empresa
- [ ] Pago inicial
- [ ] Creación automática de tenant
- [ ] Email de bienvenida

#### Sprint 12: First-Time User Experience (2 semanas)
- [ ] Tour guiado del sistema
- [ ] Quick wins (crear primer ecoaliado)
- [ ] Centro de ayuda
- [ ] Videos tutoriales
- [ ] Documentación

### Fase 4: Escalabilidad (2 meses)

#### Sprint 13: Caché y Async (2 semanas)
- [ ] Configurar Redis
- [ ] Caché de queries frecuentes
- [ ] Sessions en Redis
- [ ] Rate limiting por tenant

#### Sprint 14: Celery Workers (2 semanas)
- [ ] Configurar Celery
- [ ] Celery Beat para tareas programadas
- [ ] Tareas asíncronas:
  - [ ] Renovación de suscripciones
  - [ ] Generación de PDFs
  - [ ] Envío de emails
  - [ ] Procesamiento de webhooks

#### Sprint 15-16: Load Balancing (4 semanas)
- [ ] Múltiples instancias de Django
- [ ] Nginx load balancer
- [ ] MySQL master-slave replication
- [ ] Storage en S3
- [ ] CDN para estáticos

### Fase 5: Métricas y Analytics (1 mes)

#### Sprint 17: Métricas SaaS (2 semanas)
- [ ] Modelo `MetricSnapshot` (histórico)
- [ ] Calculador de MRR/ARR
- [ ] Churn rate
- [ ] LTV/CAC
- [ ] Revenue retention
- [ ] Cohort analysis

#### Sprint 18: Dashboard Ejecutivo (2 semanas)
- [ ] Dashboard de métricas en frontend
- [ ] Gráficos de crecimiento
- [ ] Alertas de churn
- [ ] Reports automáticos
- [ ] Exportación a Excel/PDF

### Fase 6: Optimización y Go-to-Market (1-2 meses)

#### Sprint 19: Performance (2 semanas)
- [ ] Query optimization
- [ ] Índices de base de datos
- [ ] N+1 queries
- [ ] Carga lazy
- [ ] Compresión de assets

#### Sprint 20: Seguridad (2 semanas)
- [ ] Penetration testing
- [ ] OWASP Top 10
- [ ] Rate limiting agresivo
- [ ] IP whitelisting (opcional)
- [ ] 2FA para admin

#### Sprint 21: Legal y Compliance (1 semana)
- [ ] Términos y condiciones
- [ ] Política de privacidad (Ley Habeas Data)
- [ ] GDPR compliance
- [ ] Contrato de suscripción
- [ ] SLA definido

#### Sprint 22: Marketing y Launch (1 semana)
- [ ] Landing page
- [ ] Video demo
- [ ] Pricing page
- [ ] Caso de éxito
- [ ] Estrategia de lanzamiento

---

## ESTIMACION DE ESFUERZO 📅

### Recursos Necesarios

**Equipo Mínimo:**
- 1 Backend Developer (Django/Python) - Senior
- 1 Frontend Developer (React/TypeScript) - Mid-Senior
- 1 DevOps Engineer - Mid (part-time 50%)
- 1 QA Engineer - Mid (part-time 50%)
- 1 Product Manager - Senior (part-time 30%)

**Tiempo Total:** 12-16 meses

**Desglose por Fase:**
- Fase 1 (Multi-Tenant): 3-4 meses
- Fase 2 (Billing): 2-3 meses
- Fase 3 (Onboarding): 1-2 meses
- Fase 4 (Escalabilidad): 2 meses
- Fase 5 (Métricas): 1 mes
- Fase 6 (GTM): 1-2 meses

### Costos Estimados (Colombia)

**Desarrollo:**
- Backend Dev: $8.000.000/mes × 12 = $96M COP
- Frontend Dev: $7.000.000/mes × 12 = $84M COP
- DevOps: $6.000.000/mes × 12 × 50% = $36M COP
- QA: $5.000.000/mes × 12 × 50% = $30M COP
- PM: $10.000.000/mes × 12 × 30% = $36M COP

**Total Nómina:** ~$282M COP (~$70k USD)

**Infraestructura (anual):**
- Hosting (AWS): $3M COP/mes = $36M COP/año
- Wompi (gateway): 2.99% de transacciones
- S3 Storage: $500k COP/mes = $6M COP/año
- Monitoring (Sentry, etc): $2M COP/año
- Email (SendGrid): $1M COP/año

**Total Infraestructura:** ~$45M COP (~$11k USD)

**TOTAL PROYECTO:** ~$327M COP (~$81k USD)

---

## RECOMENDACIONES FINALES ✅

### ¿Vale la pena convertirlo a SaaS?

**SÍ, si:**
1. Hay demanda de mercado validada (>10 empresas interesadas)
2. Existe capital para invertir $80-100k USD
3. Se tiene un equipo técnico capacitado
4. El TAM (Total Addressable Market) es >$1M USD/año
5. La competencia actual no satisface la necesidad

**NO, si:**
- Es solo para una empresa (mantener monolítico)
- No hay presupuesto ni equipo
- El mercado es muy pequeño (<50 clientes potenciales)

### Alternativa: SaaS Ligero (MVP)

Si el presupuesto es limitado, considerar un **SaaS Lite**:

**Arquitectura simplificada:**
- Row-level tenancy (no schema-per-tenant)
- Stripe/PayU (no Wompi custom)
- Sin DIAN automática (facturas manuales)
- Sin Celery (tasks síncronas)
- Single instance con auto-scaling

**Tiempo:** 4-6 meses
**Costo:** ~$30-40k USD
**Capacidad:** 50-100 clientes

### Próximos Pasos Inmediatos

1. **Validar mercado** (2 semanas)
   - Entrevistar 20 consultoras/empresas
   - Validar willingness to pay
   - Confirmar pricing ($99k-$999k COP)

2. **Prototipo de pricing** (1 semana)
   - Diseñar landing page
   - Publicar pricing
   - Medir interés (signups)

3. **MVP técnico** (3 meses)
   - Multi-tenancy básico (row-level)
   - Stripe payments
   - Onboarding simple
   - 1 plan ($249k/mes)

4. **Beta privada** (2 meses)
   - 5-10 clientes beta
   - Feedback intensivo
   - Iterar producto

5. **Launch público** (mes 6)
   - Marketing campaign
   - Sales outreach
   - Objetivo: 30 clientes pagos en 6 meses

---

## CONTACTO Y SOPORTE 📧

Para implementar estas recomendaciones, contactar:

**SAAS Architect - Colombia Edition**
Especialista en arquitectura multi-tenant para mercado colombiano
Experiencia: 12+ años en SaaS B2B

---

**Última actualización:** 17 Diciembre 2025
**Versión Análisis:** 1.0
**Status:** ✅ COMPLETO
