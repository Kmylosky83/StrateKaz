"""
Tests Unitarios para el modelo EmpresaConfig
Sistema de Gestión StrateKaz

Cobertura de tests:
1. Patrón Singleton - Solo permite una instancia
2. Validación de NIT colombiano con dígito de verificación DIAN
3. Formateo automático de NIT
4. Propiedades computadas (nit_sin_dv, digito_verificacion)
5. Método get_instance()
6. Validaciones de separadores de miles y decimales
"""
import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.gestion_estrategica.configuracion.models import (
    EmpresaConfig,
    validar_nit_colombiano,
)


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def datos_empresa_validos():
    """Fixture con datos validos para crear una EmpresaConfig."""
    return {
        'nit': '900123456-7',
        'razon_social': 'STRATEKAZ S.A.S.',
    }


@pytest.fixture
def empresa_instance(db, datos_empresa_validos):
    """Fixture que crea una instancia de EmpresaConfig para pruebas."""
    empresa = EmpresaConfig.objects.create(**datos_empresa_validos)
    return empresa


# ==============================================================================
# TESTS DE VALIDACIÓN DE NIT
# ==============================================================================

class TestValidacionNIT:
    """Tests para validar_nit_colombiano con el algoritmo DIAN."""

    @pytest.mark.django_db
    def test_nit_valido_con_guion(self):
        """
        Given: Un NIT válido con formato correcto 900123456-7
        When: Se valida el NIT
        Then: No debe lanzar excepción
        """
        # Given
        nit = '900123456-7'

        # When & Then
        try:
            validar_nit_colombiano(nit)
        except ValidationError:
            pytest.fail("NIT válido no debería lanzar ValidationError")

    @pytest.mark.django_db
    def test_nit_valido_sin_guion(self):
        """
        Given: Un NIT válido sin guion 9001234567
        When: Se valida el NIT
        Then: No debe lanzar excepción
        """
        # Given
        nit = '9001234567'

        # When & Then
        try:
            validar_nit_colombiano(nit)
        except ValidationError:
            pytest.fail("NIT válido sin guion no debería lanzar ValidationError")

    @pytest.mark.django_db
    def test_nit_valido_con_puntos(self):
        """
        Given: Un NIT válido con puntos 900.123.456-7
        When: Se valida el NIT
        Then: No debe lanzar excepción (los puntos se limpian)
        """
        # Given
        nit = '900.123.456-7'

        # When & Then
        try:
            validar_nit_colombiano(nit)
        except ValidationError:
            pytest.fail("NIT válido con puntos no debería lanzar ValidationError")

    @pytest.mark.django_db
    def test_nit_digito_verificacion_incorrecto(self):
        """
        Given: Un NIT con dígito de verificación incorrecto
        When: Se valida el NIT
        Then: Debe lanzar ValidationError indicando el dígito correcto
        """
        # Given
        nit_incorrecto = '900123456-9'  # DV correcto es 7

        # When & Then
        with pytest.raises(ValidationError) as exc_info:
            validar_nit_colombiano(nit_incorrecto)

        # Verificar mensaje de error
        assert 'Debería ser 7, no 9' in str(exc_info.value)

    @pytest.mark.django_db
    def test_nit_formato_incorrecto_pocos_digitos(self):
        """
        Given: Un NIT con menos de 10 dígitos
        When: Se valida el NIT
        Then: Debe lanzar ValidationError sobre el formato
        """
        # Given
        nit_corto = '12345-6'

        # When & Then
        with pytest.raises(ValidationError) as exc_info:
            validar_nit_colombiano(nit_corto)

        assert 'debe tener el formato' in str(exc_info.value).lower()

    @pytest.mark.django_db
    def test_nit_formato_incorrecto_letras(self):
        """
        Given: Un NIT con letras
        When: Se valida el NIT
        Then: Debe lanzar ValidationError sobre el formato
        """
        # Given
        nit_letras = '900ABC456-7'

        # When & Then
        with pytest.raises(ValidationError) as exc_info:
            validar_nit_colombiano(nit_letras)

        assert 'debe tener el formato' in str(exc_info.value).lower()

    @pytest.mark.django_db
    def test_calculo_dv_caso_residuo_cero(self):
        """
        Given: Un NIT cuyo cálculo resulta en residuo 0
        When: Se calcula el DV
        Then: El DV debe ser 0
        """
        # Given - NIT que genera residuo 0: 830054841-0
        nit = '830054841-0'

        # When & Then
        try:
            validar_nit_colombiano(nit)
        except ValidationError:
            pytest.fail("NIT con DV=0 válido no debería lanzar ValidationError")

    @pytest.mark.django_db
    def test_calculo_dv_caso_residuo_uno(self):
        """
        Given: Un NIT cuyo cálculo resulta en residuo 1
        When: Se calcula el DV
        Then: El DV debe ser 1
        """
        # Given - NIT que genera residuo 1: 900108281-1
        nit = '900108281-1'

        # When & Then
        try:
            validar_nit_colombiano(nit)
        except ValidationError:
            pytest.fail("NIT con DV=1 válido no debería lanzar ValidationError")

    @pytest.mark.django_db
    def test_nits_reales_colombianos(self):
        """
        Given: NITs reales de empresas colombianas
        When: Se validan los NITs
        Then: Todos deben pasar la validación
        """
        # Given - NITs reales de empresas colombianas conocidas
        nits_validos = [
            '860007738-9',  # Bancolombia
            '890903938-8',  # Grupo Éxito
            '860034313-7',  # Davivienda
            '900123456-7',  # NIT de ejemplo válido
        ]

        # When & Then
        for nit in nits_validos:
            try:
                validar_nit_colombiano(nit)
            except ValidationError:
                pytest.fail(f"NIT real {nit} no debería lanzar ValidationError")


# ==============================================================================
# TESTS DEL PATRÓN SINGLETON
# ==============================================================================

class TestSingletonPattern:
    """Tests para verificar que EmpresaConfig implementa el patrón Singleton."""

    @pytest.mark.django_db
    def test_permite_crear_primera_instancia(self, datos_empresa_validos):
        """
        Given: No existe ninguna instancia de EmpresaConfig
        When: Se crea la primera instancia
        Then: Debe crearse exitosamente
        """
        # Given - DB vacía (fixture db)
        assert EmpresaConfig.objects.count() == 0

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.pk is not None
        assert EmpresaConfig.objects.count() == 1

    @pytest.mark.django_db
    def test_impide_crear_segunda_instancia(self, empresa_instance):
        """
        Given: Ya existe una instancia de EmpresaConfig
        When: Se intenta crear una segunda instancia
        Then: Debe lanzar ValidationError
        """
        # Given
        assert EmpresaConfig.objects.count() == 1

        # When & Then
        with pytest.raises(ValidationError) as exc_info:
            EmpresaConfig.objects.create(
                nit='860007738-9',
                razon_social='OTRA EMPRESA S.A.S.',
            )

        # Verificar mensaje de error
        assert 'Ya existe una configuración de empresa' in str(exc_info.value)
        assert 'get_instance()' in str(exc_info.value)

    @pytest.mark.django_db
    def test_permite_actualizar_instancia_existente(self, empresa_instance):
        """
        Given: Existe una instancia de EmpresaConfig
        When: Se actualiza esa instancia
        Then: Debe permitir la actualización
        """
        # Given
        pk_original = empresa_instance.pk
        razon_social_original = empresa_instance.razon_social

        # When
        empresa_instance.razon_social = 'NUEVA RAZÓN SOCIAL S.A.S.'
        empresa_instance.save()

        # Then
        empresa_instance.refresh_from_db()
        assert empresa_instance.pk == pk_original
        assert empresa_instance.razon_social == 'NUEVA RAZÓN SOCIAL S.A.S.'
        assert empresa_instance.razon_social != razon_social_original
        assert EmpresaConfig.objects.count() == 1


# ==============================================================================
# TESTS DE FORMATEO DE NIT
# ==============================================================================

class TestFormateoNIT:
    """Tests para el formateo automático de NIT al guardar."""

    @pytest.mark.django_db
    def test_formatea_nit_sin_guion(self, datos_empresa_validos):
        """
        Given: Un NIT sin guion (10 dígitos seguidos)
        When: Se guarda la instancia
        Then: El NIT debe formatearse con guion 900123456-7
        """
        # Given
        datos_empresa_validos['nit'] = '9001234567'

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.nit == '900123456-7'
        assert '-' in empresa.nit

    @pytest.mark.django_db
    def test_formatea_nit_con_puntos(self, datos_empresa_validos):
        """
        Given: Un NIT con puntos y guion 900.123.456-7
        When: Se guarda la instancia
        Then: El NIT debe formatearse sin puntos 900123456-7
        """
        # Given
        datos_empresa_validos['nit'] = '900.123.456-7'

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.nit == '900123456-7'
        assert '.' not in empresa.nit

    @pytest.mark.django_db
    def test_formatea_nit_con_espacios(self, datos_empresa_validos):
        """
        Given: Un NIT con espacios 900 123 456-7
        When: Se guarda la instancia
        Then: El NIT debe formatearse sin espacios 900123456-7
        """
        # Given
        datos_empresa_validos['nit'] = '900 123 456-7'

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.nit == '900123456-7'
        assert ' ' not in empresa.nit

    @pytest.mark.django_db
    def test_mantiene_formato_correcto(self, datos_empresa_validos):
        """
        Given: Un NIT ya formateado correctamente 900123456-7
        When: Se guarda la instancia
        Then: El NIT debe mantenerse igual
        """
        # Given
        datos_empresa_validos['nit'] = '900123456-7'

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.nit == '900123456-7'


# ==============================================================================
# TESTS DE PROPIEDADES COMPUTADAS
# ==============================================================================

class TestPropiedadesComputadas:
    """Tests para las propiedades computadas del modelo."""

    @pytest.mark.django_db
    def test_nit_sin_dv_property(self, empresa_instance):
        """
        Given: Una empresa con NIT 900123456-7
        When: Se accede a la propiedad nit_sin_dv
        Then: Debe retornar 900123456 (sin el dígito de verificación)
        """
        # Given
        empresa_instance.nit = '900123456-7'
        empresa_instance.save()

        # When
        nit_sin_dv = empresa_instance.nit_sin_dv

        # Then
        assert nit_sin_dv == '900123456'
        assert '-' not in nit_sin_dv

    @pytest.mark.django_db
    def test_digito_verificacion_property(self, empresa_instance):
        """
        Given: Una empresa con NIT 900123456-7
        When: Se accede a la propiedad digito_verificacion
        Then: Debe retornar 7 (el dígito de verificación)
        """
        # Given
        empresa_instance.nit = '900123456-7'
        empresa_instance.save()

        # When
        dv = empresa_instance.digito_verificacion

        # Then
        assert dv == '7'

    # test_direccion_completa_property y test_direccion_completa_con_pais_extranjero
    # ELIMINADOS: EmpresaConfig ya no tiene campos direccion_fiscal, ciudad,
    # departamento, pais. Esos datos se gestionan en Tenant.


# ==============================================================================
# TESTS DEL MÉTODO get_instance()
# ==============================================================================

class TestGetInstance:
    """Tests para el método de clase get_instance()."""

    @pytest.mark.django_db
    def test_get_instance_cuando_existe(self, empresa_instance):
        """
        Given: Existe una instancia de EmpresaConfig
        When: Se llama a get_instance()
        Then: Debe retornar la instancia existente
        """
        # Given
        pk_original = empresa_instance.pk

        # When
        instance = EmpresaConfig.get_instance()

        # Then
        assert instance is not None
        assert instance.pk == pk_original
        assert instance.nit == empresa_instance.nit

    @pytest.mark.django_db
    def test_get_instance_cuando_no_existe(self, db):
        """
        Given: No existe ninguna instancia de EmpresaConfig
        When: Se llama a get_instance()
        Then: Debe retornar None
        """
        # Given
        assert EmpresaConfig.objects.count() == 0

        # When
        instance = EmpresaConfig.get_instance()

        # Then
        assert instance is None


# ==============================================================================
# TESTS DEL MÉTODO get_or_create_default()
# ==============================================================================

class TestGetOrCreateDefault:
    """Tests para el método de clase get_or_create_default()."""

    @pytest.mark.django_db
    def test_get_or_create_cuando_existe(self, empresa_instance):
        """
        Given: Existe una instancia de EmpresaConfig
        When: Se llama a get_or_create_default()
        Then: Debe retornar la instancia existente y created=False
        """
        # Given
        pk_original = empresa_instance.pk

        # When
        instance, created = EmpresaConfig.get_or_create_default()

        # Then
        assert created is False
        assert instance.pk == pk_original
        assert instance.nit == empresa_instance.nit

    @pytest.mark.django_db
    def test_get_or_create_cuando_no_existe(self, db):
        """
        Given: No existe ninguna instancia de EmpresaConfig
        When: Se llama a get_or_create_default()
        Then: Debe crear una instancia con valores por defecto y created=True
        """
        # Given
        assert EmpresaConfig.objects.count() == 0

        # When
        instance, created = EmpresaConfig.get_or_create_default()

        # Then
        assert created is True
        assert instance.pk is not None
        assert instance.nit == '000000000-0'
        assert instance.razon_social == 'Empresa Sin Configurar'
        assert EmpresaConfig.objects.count() == 1


# ==============================================================================
# TESTS DE VALIDACIONES
# ==============================================================================

class TestValidaciones:
    """Tests para validaciones del modelo."""

    @pytest.mark.django_db
    def test_validacion_separadores_iguales(self, empresa_instance):
        """
        Given: Una empresa con separador de miles igual al de decimales
        When: Se ejecuta clean()
        Then: Debe lanzar ValidationError
        """
        # Given
        empresa_instance.separador_miles = ','
        empresa_instance.separador_decimales = ','

        # When & Then
        with pytest.raises(ValidationError) as exc_info:
            empresa_instance.clean()

        assert 'separador_decimales' in str(exc_info.value)

    @pytest.mark.django_db
    def test_validacion_separadores_diferentes_validos(self, empresa_instance):
        """
        Given: Una empresa con separadores diferentes
        When: Se ejecuta clean()
        Then: No debe lanzar excepción
        """
        # Given
        empresa_instance.separador_miles = '.'
        empresa_instance.separador_decimales = ','

        # When & Then
        try:
            empresa_instance.clean()
        except ValidationError:
            pytest.fail("Separadores diferentes no deberían lanzar ValidationError")


# ==============================================================================
# TESTS DE FORMATEO DE VALORES
# ==============================================================================

class TestFormateoValores:
    """Tests para el método formatear_valor()."""

    @pytest.mark.django_db
    def test_formatear_valor_entero(self, empresa_instance):
        """
        Given: Una empresa con configuración regional COP (. para miles, , para decimales)
        When: Se formatea un valor entero (1000000)
        Then: Debe retornar $ 1.000.000
        """
        # Given
        empresa_instance.simbolo_moneda = '$'
        empresa_instance.separador_miles = '.'
        empresa_instance.separador_decimales = ','

        # When
        resultado = empresa_instance.formatear_valor(1000000)

        # Then
        assert '$' in resultado
        assert '1.000.000' in resultado

    @pytest.mark.django_db
    def test_formatear_valor_con_decimales(self, empresa_instance):
        """
        Given: Una empresa con configuración regional COP
        When: Se formatea un valor con decimales (1500.50)
        Then: Debe retornar $ 1.500,50
        """
        # Given
        empresa_instance.simbolo_moneda = '$'
        empresa_instance.separador_miles = '.'
        empresa_instance.separador_decimales = ','

        # When
        resultado = empresa_instance.formatear_valor(1500.50)

        # Then
        assert '$' in resultado
        assert '1.500' in resultado
        assert ',50' in resultado

    @pytest.mark.django_db
    def test_formatear_valor_cero(self, empresa_instance):
        """
        Given: Una empresa configurada
        When: Se formatea el valor 0
        Then: Debe retornar $ 0
        """
        # Given
        empresa_instance.simbolo_moneda = '$'

        # When
        resultado = empresa_instance.formatear_valor(0)

        # Then
        assert '$' in resultado
        assert '0' in resultado


# ==============================================================================
# TESTS DE AUDITORÍA
# ==============================================================================

class TestAuditoria:
    """Tests para campos de auditoría."""

    @pytest.mark.django_db
    def test_created_at_automatico(self, datos_empresa_validos):
        """
        Given: Datos válidos para crear una empresa
        When: Se crea la instancia
        Then: created_at debe establecerse automáticamente
        """
        # Given
        antes_creacion = timezone.now()

        # When
        empresa = EmpresaConfig.objects.create(**datos_empresa_validos)

        # Then
        assert empresa.created_at is not None
        assert empresa.created_at >= antes_creacion

    @pytest.mark.django_db
    def test_updated_at_se_actualiza(self, empresa_instance):
        """
        Given: Una instancia de empresa existente
        When: Se modifica y guarda
        Then: updated_at debe actualizarse
        """
        # Given
        updated_at_original = empresa_instance.updated_at

        # When
        import time
        time.sleep(0.1)  # Pequeña pausa para asegurar diferencia de tiempo
        empresa_instance.razon_social = 'NUEVA RAZÓN SOCIAL'
        empresa_instance.save()

        # Then
        empresa_instance.refresh_from_db()
        assert empresa_instance.updated_at > updated_at_original


# ==============================================================================
# TESTS DE REPRESENTACIÓN STRING
# ==============================================================================

class TestRepresentacionString:
    """Tests para el método __str__."""

    @pytest.mark.django_db
    def test_str_incluye_razon_social_y_nit(self, empresa_instance):
        """
        Given: Una instancia de EmpresaConfig
        When: Se convierte a string
        Then: Debe incluir razón social y NIT
        """
        # Given
        empresa_instance.razon_social = 'GRASAS Y HUESOS DEL NORTE S.A.S.'
        empresa_instance.nit = '900123456-7'
        empresa_instance.save()

        # When
        str_representation = str(empresa_instance)

        # Then
        assert 'GRASAS Y HUESOS DEL NORTE S.A.S.' in str_representation
        assert '900123456-7' in str_representation
        assert 'NIT' in str_representation
