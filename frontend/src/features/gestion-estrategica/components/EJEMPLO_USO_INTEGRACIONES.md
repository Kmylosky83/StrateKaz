# Ejemplo de Uso - Módulo de Integraciones Externas

Este documento muestra cómo usar los componentes del módulo de Integraciones Externas en el tab de Configuración.

## 1. Estructura de Archivos Creados

```
frontend/src/features/gestion-estrategica/components/
├── IntegracionesSection.tsx          # Componente principal
├── IntegracionFormModal.tsx          # Modal de creación/edición
├── IntegracionStatusBadge.tsx        # Badge de estado de salud
├── TestConnectionButton.tsx          # Botón para probar conexión
├── CredencialesEditor.tsx            # Editor de credenciales seguro
└── index.ts                          # Exports
```

## 2. Uso en ConfiguracionTab.tsx

```tsx
// ConfiguracionTab.tsx
import { IntegracionesSection } from './IntegracionesSection';
import type { IntegracionFormData } from './IntegracionFormModal';

export const ConfiguracionTab = () => {
  // Ejemplo de datos mock - reemplazar con hook real
  const integraciones = [
    {
      id: 1,
      nombre: 'SendGrid - Correos Transaccionales',
      tipo_servicio: 'EMAIL',
      proveedor: 'SendGrid',
      descripcion: 'Envío de correos transaccionales y notificaciones',
      endpoint_base: 'https://api.sendgrid.com/v3',
      metodo_autenticacion: 'API_KEY',
      credenciales: {
        api_key: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
      configuracion_adicional: {
        from_email: 'noreply@grasasyhuesos.com',
        from_name: 'StrateKaz',
      },
      ambiente: 'PRODUCCION',
      activo: true,
      ultima_conexion: '2025-12-13T10:30:00Z',
      errores_recientes: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-12-13T10:30:00Z',
    },
    {
      id: 2,
      nombre: 'Dataico - Facturación Electrónica',
      tipo_servicio: 'FACTURACION',
      proveedor: 'Dataico',
      descripcion: 'Emisión de facturas electrónicas DIAN Colombia',
      endpoint_base: 'https://api.dataico.com/v2',
      metodo_autenticacion: 'API_KEY_SECRET',
      credenciales: {
        api_key: 'pk_test_xxxxxxxxxxxx',
        api_secret: 'sk_test_xxxxxxxxxxxx',
      },
      configuracion_adicional: {
        nit: '900123456-1',
        environment: 'test',
      },
      ambiente: 'SANDBOX',
      activo: true,
      ultima_conexion: '2025-12-12T15:00:00Z',
      errores_recientes: 2,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-12-12T15:00:00Z',
    },
  ];

  const handleCreateIntegracion = async (data: IntegracionFormData) => {
    console.log('Crear integración:', data);
    // Implementar llamada a API
  };

  const handleUpdateIntegracion = async (id: number, data: IntegracionFormData) => {
    console.log('Actualizar integración:', id, data);
    // Implementar llamada a API
  };

  const handleDeleteIntegracion = async (id: number) => {
    console.log('Eliminar integración:', id);
    // Implementar llamada a API
  };

  const handleToggleIntegracion = async (id: number, activo: boolean) => {
    console.log('Toggle integración:', id, activo);
    // Implementar llamada a API
  };

  const handleTestConnection = async (data: IntegracionFormData) => {
    console.log('Probar conexión:', data);
    // Implementar prueba de conexión real
    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Retornar resultado
    return {
      success: Math.random() > 0.3, // 70% éxito
      message: Math.random() > 0.3
        ? 'Conexión exitosa. La integración está funcionando correctamente.'
        : 'Error al conectar. Verifica las credenciales y el endpoint.',
    };
  };

  return (
    <div className="space-y-6">
      {/* Otras secciones del tab de Configuración */}

      {/* Sección de Integraciones */}
      <IntegracionesSection
        integraciones={integraciones}
        isLoading={false}
        error={null}
        onCreateIntegracion={handleCreateIntegracion}
        onUpdateIntegracion={handleUpdateIntegracion}
        onDeleteIntegracion={handleDeleteIntegracion}
        onToggleIntegracion={handleToggleIntegracion}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
};
```

## 3. Integración con Backend (Hooks)

Crear hooks personalizados para manejar la lógica de API:

```tsx
// frontend/src/features/gestion-estrategica/hooks/useIntegraciones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { IntegracionFormData } from '../components/IntegracionFormModal';

interface Integracion extends IntegracionFormData {
  id: number;
  ultima_conexion: string | null;
  errores_recientes: number;
  created_at: string;
  updated_at: string;
}

export const useIntegraciones = () => {
  return useQuery({
    queryKey: ['integraciones'],
    queryFn: async () => {
      const response = await api.get<Integracion[]>('/api/integraciones/');
      return response.data;
    },
  });
};

export const useCreateIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IntegracionFormData) => {
      const response = await api.post('/api/integraciones/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
    },
  });
};

export const useUpdateIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IntegracionFormData }) => {
      const response = await api.patch(`/api/integraciones/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
    },
  });
};

export const useDeleteIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/integraciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
    },
  });
};

export const useToggleIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      const response = await api.patch(`/api/integraciones/${id}/`, { activo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
    },
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: async (data: IntegracionFormData) => {
      const response = await api.post('/api/integraciones/test-connection/', data);
      return response.data;
    },
  });
};
```

## 4. Uso con Hooks Reales

```tsx
// ConfiguracionTab.tsx con hooks
import { IntegracionesSection } from './IntegracionesSection';
import {
  useIntegraciones,
  useCreateIntegracion,
  useUpdateIntegracion,
  useDeleteIntegracion,
  useToggleIntegracion,
  useTestConnection,
} from '../hooks/useIntegraciones';

export const ConfiguracionTab = () => {
  const { data: integraciones = [], isLoading, error } = useIntegraciones();
  const createMutation = useCreateIntegracion();
  const updateMutation = useUpdateIntegracion();
  const deleteMutation = useDeleteIntegracion();
  const toggleMutation = useToggleIntegracion();
  const testConnectionMutation = useTestConnection();

  return (
    <div className="space-y-6">
      <IntegracionesSection
        integraciones={integraciones}
        isLoading={isLoading}
        error={error}
        onCreateIntegracion={(data) => createMutation.mutateAsync(data)}
        onUpdateIntegracion={(id, data) => updateMutation.mutateAsync({ id, data })}
        onDeleteIntegracion={(id) => deleteMutation.mutateAsync(id)}
        onToggleIntegracion={(id, activo) => toggleMutation.mutateAsync({ id, activo })}
        onTestConnection={(data) => testConnectionMutation.mutateAsync(data)}
      />
    </div>
  );
};
```

## 5. Endpoints Backend Requeridos

El backend debe implementar los siguientes endpoints:

```python
# backend/apps/core/urls.py (o similar)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import IntegracionViewSet

router = DefaultRouter()
router.register(r'integraciones', IntegracionViewSet, basename='integracion')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

```python
# backend/apps/core/viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Integracion
from .serializers import IntegracionSerializer

class IntegracionViewSet(viewsets.ModelViewSet):
    queryset = Integracion.objects.all()
    serializer_class = IntegracionSerializer

    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        """Endpoint para probar conexión de integración"""
        # Implementar lógica de prueba
        # Retornar: { "success": true/false, "message": "..." }
        pass
```

## 6. Características Implementadas

### IntegracionesSection
- ✅ Tabla con iconos por tipo de servicio
- ✅ Filtros por tipo de servicio y estado
- ✅ Estados de salud (verde, amarillo, rojo, gris)
- ✅ Acciones: probar, editar, toggle, eliminar
- ✅ Empty state cuando no hay integraciones
- ✅ Contador de integraciones
- ✅ Formateo de última conexión

### IntegracionFormModal
- ✅ 4 tabs: Identificación, Configuración Técnica, Credenciales, Adicional
- ✅ Campos dinámicos según tipo de servicio
- ✅ Editor JSON para configuración adicional
- ✅ Preview de configuración parseada
- ✅ Validaciones de formulario
- ✅ Botón "Probar Conexión" integrado

### IntegracionStatusBadge
- ✅ 4 estados: healthy, warning, error, inactive
- ✅ Iconos y colores según estado
- ✅ Contador de errores
- ✅ Helper para calcular estado basado en última conexión

### TestConnectionButton
- ✅ 4 estados: idle, loading, success, error
- ✅ Animaciones y feedback visual
- ✅ Auto-reset después de 3-5 segundos
- ✅ Mensaje de resultado integrado

### CredencialesEditor
- ✅ Campos dinámicos según método de autenticación
- ✅ Valores enmascarados por defecto
- ✅ Botón mostrar/ocultar valores
- ✅ Soporte para 7 métodos diferentes
- ✅ Validaciones integradas
- ✅ Iconos descriptivos

## 7. Tipos de Servicio Soportados

- 📧 **EMAIL**: Correo Electrónico (SendGrid, Mailgun, SES)
- 🧾 **FACTURACION**: Facturación Electrónica (Dataico, Alegra)
- 💬 **SMS**: Mensajería SMS (Twilio, Nexmo)
- 📱 **WHATSAPP**: WhatsApp Business API
- 🗺️ **MAPAS**: Mapas y Geolocalización (Google Maps, Mapbox)
- 💾 **ALMACENAMIENTO**: Cloud Storage (AWS S3, Azure Blob)
- 📊 **BI**: Business Intelligence (Power BI, Tableau)
- 💳 **PAGOS**: Pasarelas de Pago (Stripe, PayU)
- 🏢 **ERP**: ERP Externo (SAP, Oracle)
- ✍️ **FIRMA_DIGITAL**: Firma Digital (DocuSign, Adobe Sign)

## 8. Métodos de Autenticación Soportados

- 🔑 **API_KEY**: API Key simple
- 🔐 **API_KEY_SECRET**: API Key + Secret
- 👤 **BASIC_AUTH**: Usuario y Contraseña
- 🎫 **BEARER_TOKEN**: Bearer Token (JWT)
- 🔄 **OAUTH2**: OAuth 2.0 (Client ID + Secret)
- 📄 **SERVICE_ACCOUNT**: Service Account JSON (Google Cloud)
- 🛡️ **CERTIFICADO**: Certificado Digital (PEM)

## 9. Próximos Pasos

1. Implementar endpoints en el backend Django
2. Crear modelos de base de datos para Integracion
3. Implementar lógica de prueba de conexión real
4. Agregar logs de actividad de integraciones
5. Implementar webhooks para notificaciones
6. Agregar métricas y estadísticas de uso
