"""
Tests para el cálculo de estadísticas de la sección Empresa
Backend - Módulo Configuración - Gestión Estratégica

Valida que el cálculo de completitud de datos de empresa funcione correctamente
"""
import pytest
from django.utils import timezone
from datetime import date

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.gestion_estrategica.configuracion.stats_views import calculate_empresa_stats


@pytest.mark.django_db
class TestEmpresaStats:
    """Suite de tests para estadísticas de empresa"""

    def test_sin_empresa_configurada(self):
        """
        Verifica que cuando no hay empresa configurada,
        retorna estadística de 'Sin configurar'
        """
        # Asegurar que no hay empresa
        EmpresaConfig.objects.all().delete()

        stats = calculate_empresa_stats()

        # Debe retornar al menos un stat
        assert len(stats) > 0

        # El primer stat debe indicar sin configuración
        stat_config = stats[0]
        assert stat_config['key'] == 'is_configured'
        assert stat_config['value'] == 'Sin configurar'
        assert stat_config['icon'] == 'AlertCircle'
        assert stat_config['iconColor'] == 'warning'

    def test_empresa_completa_todos_campos_requeridos(self):
        """
        Verifica que cuando todos los campos requeridos están llenos,
        la completitud sea 12/12 (100%)
        """
        # Crear empresa con TODOS los campos requeridos
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Grasas y Huesos del Norte S.A.S.',
            representante_legal='Juan Pérez',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle 123 # 45-67',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='+57 601 1234567',
            email_corporativo='contacto@empresa-demo.com',
            actividad_economica='1011',
            nombre_comercial='Empresa Demo SAS'
        )

        stats = calculate_empresa_stats()

        # Encontrar el stat de completitud
        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )

        assert completitud_stat is not None, "Debe existir el stat de campos_completos"
        assert completitud_stat['value'] == '12/12', f"Esperado 12/12, obtenido {completitud_stat['value']}"
        assert completitud_stat['iconColor'] == 'success', "Debe ser verde (success) cuando está al 100%"
        assert '100%' in completitud_stat['description'], "Debe indicar 100% en la descripción"

    def test_empresa_parcialmente_completa(self):
        """
        Verifica que cuando solo hay campos mínimos (sin opcionales),
        la completitud sea 10/12 (83%)
        """
        # Crear empresa SIN campos opcionales (actividad_economica, nombre_comercial)
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com',
            # actividad_economica=None (opcional)
            # nombre_comercial=None (opcional)
        )

        stats = calculate_empresa_stats()

        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )

        assert completitud_stat is not None
        assert completitud_stat['value'] == '10/12', f"Esperado 10/12, obtenido {completitud_stat['value']}"
        assert completitud_stat['iconColor'] == 'success', "83% debe ser success (>80%)"
        assert '83%' in completitud_stat['description'], "Debe indicar 83% en la descripción"

    def test_empresa_incompleta_muestra_warning(self):
        """
        Verifica que cuando hay 50-79% de completitud,
        muestra color warning (amarillo)
        """
        # Crear empresa con solo campos básicos (menos del 80%)
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test Incompleta',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='',  # Vacío
            email_corporativo='test@test.com',
        )

        stats = calculate_empresa_stats()

        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )

        assert completitud_stat is not None
        # Debería ser menos de 80%
        valor = completitud_stat['value']
        completos, total = map(int, valor.split('/'))
        porcentaje = (completos / total) * 100

        if 50 <= porcentaje < 80:
            assert completitud_stat['iconColor'] == 'warning', "50-79% debe ser warning"
        elif porcentaje >= 80:
            assert completitud_stat['iconColor'] == 'success', "80%+ debe ser success"
        else:
            assert completitud_stat['iconColor'] == 'danger', "<50% debe ser danger"

    def test_campos_vacios_no_cuentan(self):
        """
        Verifica que campos con strings vacíos o solo espacios
        NO cuenten como completos
        """
        # Crear empresa con campos "vacíos"
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='   ',  # Solo espacios - NO debe contar
            email_corporativo='test@test.com',
            actividad_economica='',  # Vacío - NO debe contar
            nombre_comercial='   '  # Solo espacios - NO debe contar
        )

        stats = calculate_empresa_stats()

        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )

        assert completitud_stat is not None

        # Los campos vacíos o solo con espacios NO deben contar
        valor = completitud_stat['value']
        completos, total = map(int, valor.split('/'))

        # Debe ser 9/12 (solo los que tienen contenido real)
        assert completos == 9, f"Esperado 9 campos completos (sin contar vacíos), obtenido {completos}"

    def test_stat_estado_configurada(self):
        """
        Verifica que el stat de estado muestre 'Configurada'
        cuando hay un NIT válido
        """
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com'
        )

        stats = calculate_empresa_stats()

        estado_stat = next(
            (s for s in stats if s['key'] == 'is_configured'),
            None
        )

        assert estado_stat is not None
        assert estado_stat['value'] == 'Configurada'
        assert estado_stat['icon'] == 'CheckCircle2'
        assert estado_stat['iconColor'] == 'success'

    def test_stat_antiguedad_presente(self):
        """
        Verifica que cuando hay fecha de constitución,
        aparece el stat de antigüedad
        """
        fecha_constitucion = date(2020, 1, 15)

        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com',
            fecha_constitucion=fecha_constitucion
        )

        stats = calculate_empresa_stats()

        antiguedad_stat = next(
            (s for s in stats if s['key'] == 'antiguedad'),
            None
        )

        assert antiguedad_stat is not None, "Debe existir stat de antigüedad cuando hay fecha_constitucion"
        assert antiguedad_stat['icon'] == 'Calendar'
        assert antiguedad_stat['iconColor'] == 'primary'
        # Debe contener información de años o meses
        assert 'año' in antiguedad_stat['value'] or 'mes' in antiguedad_stat['value']

    def test_stat_antiguedad_ausente_sin_fecha(self):
        """
        Verifica que cuando NO hay fecha de constitución,
        NO aparece el stat de antigüedad
        """
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com'
            # fecha_constitucion=None (por defecto)
        )

        stats = calculate_empresa_stats()

        antiguedad_stat = next(
            (s for s in stats if s['key'] == 'antiguedad'),
            None
        )

        assert antiguedad_stat is None, "NO debe existir stat de antigüedad sin fecha_constitucion"

    def test_campos_requeridos_nombres_correctos(self):
        """
        Test de regresión: Verifica que los nombres de campos
        sean los correctos del modelo (evita el bug original)
        """
        from apps.gestion_estrategica.configuracion.stats_views import calculate_empresa_stats
        import inspect

        # Obtener el código fuente de la función
        source = inspect.getsource(calculate_empresa_stats)

        # Verificar que NO use nombres incorrectos
        assert 'digito_verificacion' not in source, "NO debe usar 'digito_verificacion' (es property)"
        assert 'tipo_empresa' not in source, "NO debe usar 'tipo_empresa' (campo correcto: tipo_sociedad)"
        assert "'direccion'" not in source, "NO debe usar 'direccion' (campo correcto: direccion_fiscal)"
        assert "'telefono'" not in source, "NO debe usar 'telefono' (campo correcto: telefono_principal)"
        assert "'email'" not in source or 'email_corporativo' in source, \
            "NO debe usar 'email' (campo correcto: email_corporativo)"

        # Verificar que SÍ use nombres correctos
        assert 'tipo_sociedad' in source, "DEBE usar 'tipo_sociedad'"
        assert 'direccion_fiscal' in source, "DEBE usar 'direccion_fiscal'"
        assert 'telefono_principal' in source, "DEBE usar 'telefono_principal'"
        assert 'email_corporativo' in source, "DEBE usar 'email_corporativo'"

    def test_total_campos_es_12(self):
        """
        Verifica que el total de campos evaluados sea exactamente 12
        """
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com'
        )

        stats = calculate_empresa_stats()

        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )

        assert completitud_stat is not None
        valor = completitud_stat['value']
        _, total = map(int, valor.split('/'))

        assert total == 12, f"El total de campos debe ser 12, obtenido {total}"


@pytest.mark.django_db
class TestEmpresaStatsEdgeCases:
    """Tests de casos límite"""

    def test_nit_sin_digito_verificacion(self):
        """
        Verifica comportamiento cuando NIT no tiene formato estándar
        """
        empresa = EmpresaConfig.objects.create(
            nit='900123456',  # Sin guión (se debería formatear automáticamente)
            razon_social='Test S.A.S.',
            representante_legal='Test User',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle Test',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='1234567',
            email_corporativo='test@test.com'
        )

        # No debe fallar
        stats = calculate_empresa_stats()
        assert len(stats) > 0

        estado_stat = next(
            (s for s in stats if s['key'] == 'is_configured'),
            None
        )
        assert estado_stat is not None

    def test_valores_unicode_especiales(self):
        """
        Verifica que valores con caracteres especiales se procesen correctamente
        """
        empresa = EmpresaConfig.objects.create(
            nit='900123456-7',
            razon_social='Empresa Ñoño S.A.S. - División Técnica',
            representante_legal='José María Pérez',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            direccion_fiscal='Calle 123 # 45-67, Apto 8-A',
            ciudad='Bogotá D.C.',
            departamento='CUNDINAMARCA',
            telefono_principal='+57 (601) 123-4567',
            email_corporativo='info@empresa-ñoño.com.co'
        )

        # No debe fallar
        stats = calculate_empresa_stats()
        assert len(stats) > 0

        completitud_stat = next(
            (s for s in stats if s['key'] == 'campos_completos'),
            None
        )
        assert completitud_stat is not None
        # Debe contar correctamente campos con unicode
        assert '/' in completitud_stat['value']
