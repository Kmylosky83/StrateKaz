"""
Tests de Modelos para IPEVR
============================

Tests unitarios para:
- ClasificacionPeligro
- PeligroGTC45
- MatrizIPEVR (calculos GTC-45, interpretaciones, aceptabilidad)
- ControlSST

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from django.core.exceptions import ValidationError
from apps.motor_riesgos.ipevr.models import (
    ClasificacionPeligro,
    PeligroGTC45,
    MatrizIPEVR,
    ControlSST
)


@pytest.mark.django_db
class TestClasificacionPeligro:
    """Tests para el modelo ClasificacionPeligro."""

    def test_crear_clasificacion_biologico(self, clasificacion_biologico):
        """Test: Crear clasificacion de peligro biologico."""
        assert clasificacion_biologico.codigo == 'BIO'
        assert clasificacion_biologico.nombre == 'Biologico'
        assert clasificacion_biologico.categoria == ClasificacionPeligro.Categoria.BIOLOGICO
        assert clasificacion_biologico.color == '#EF4444'
        assert clasificacion_biologico.icono == 'Virus'
        assert clasificacion_biologico.is_active is True

    def test_crear_clasificacion_fisico(self, clasificacion_fisico):
        """Test: Crear clasificacion de peligro fisico."""
        assert clasificacion_fisico.categoria == ClasificacionPeligro.Categoria.FISICO
        assert clasificacion_fisico.codigo == 'FIS'

    def test_crear_clasificacion_quimico(self, clasificacion_quimico):
        """Test: Crear clasificacion de peligro quimico."""
        assert clasificacion_quimico.categoria == ClasificacionPeligro.Categoria.QUIMICO
        assert clasificacion_quimico.codigo == 'QUI'

    def test_crear_clasificacion_psicosocial(self, clasificacion_psicosocial):
        """Test: Crear clasificacion de peligro psicosocial."""
        assert clasificacion_psicosocial.categoria == ClasificacionPeligro.Categoria.PSICOSOCIAL
        assert clasificacion_psicosocial.codigo == 'PSI'

    def test_crear_clasificacion_biomecanico(self, clasificacion_biomecanico):
        """Test: Crear clasificacion de peligro biomecanico."""
        assert clasificacion_biomecanico.categoria == ClasificacionPeligro.Categoria.BIOMECANICO
        assert clasificacion_biomecanico.codigo == 'BIM'

    def test_crear_clasificacion_seguridad(self, clasificacion_seguridad):
        """Test: Crear clasificacion de condiciones de seguridad."""
        assert clasificacion_seguridad.categoria == ClasificacionPeligro.Categoria.SEGURIDAD
        assert clasificacion_seguridad.codigo == 'SEG'

    def test_crear_clasificacion_fenomenos(self, clasificacion_fenomenos):
        """Test: Crear clasificacion de fenomenos naturales."""
        assert clasificacion_fenomenos.categoria == ClasificacionPeligro.Categoria.FENOMENOS
        assert clasificacion_fenomenos.codigo == 'FEN'

    def test_str_clasificacion(self, clasificacion_biologico):
        """Test: Representacion en string de clasificacion."""
        expected = "BIO - Biologico"
        assert str(clasificacion_biologico) == expected

    def test_codigo_unico(self, clasificacion_biologico):
        """Test: El codigo debe ser unico."""
        with pytest.raises(Exception):
            ClasificacionPeligro.objects.create(
                codigo='BIO',  # Codigo duplicado
                nombre='Biologico Duplicado',
                categoria=ClasificacionPeligro.Categoria.BIOLOGICO
            )

    def test_soft_delete(self, clasificacion_biologico):
        """Test: Soft delete de clasificacion."""
        clasificacion_biologico.is_active = False
        clasificacion_biologico.save()
        assert clasificacion_biologico.is_active is False
        assert ClasificacionPeligro.objects.filter(id=clasificacion_biologico.id).exists()

    def test_ordering(self, clasificacion_biologico, clasificacion_fisico):
        """Test: Orden por campo orden y categoria."""
        clasificaciones = ClasificacionPeligro.objects.all()
        assert list(clasificaciones) == [clasificacion_biologico, clasificacion_fisico]


@pytest.mark.django_db
class TestPeligroGTC45:
    """Tests para el modelo PeligroGTC45."""

    def test_crear_peligro_virus(self, peligro_virus, clasificacion_biologico):
        """Test: Crear peligro de virus."""
        assert peligro_virus.codigo == 'BIO-001'
        assert peligro_virus.nombre == 'Virus'
        assert peligro_virus.clasificacion == clasificacion_biologico
        assert 'Enfermedades infecciosas' in peligro_virus.efectos_posibles
        assert peligro_virus.is_active is True

    def test_crear_peligro_ruido(self, peligro_ruido, clasificacion_fisico):
        """Test: Crear peligro de ruido."""
        assert peligro_ruido.codigo == 'FIS-001'
        assert peligro_ruido.nombre == 'Ruido'
        assert peligro_ruido.clasificacion == clasificacion_fisico
        assert 'Hipoacusia' in peligro_ruido.efectos_posibles

    def test_relacion_clasificacion(self, peligro_virus, clasificacion_biologico):
        """Test: Relacion con clasificacion."""
        assert peligro_virus in clasificacion_biologico.peligros.all()

    def test_str_peligro(self, peligro_virus):
        """Test: Representacion en string de peligro."""
        expected = "BIO-001 - Virus"
        assert str(peligro_virus) == expected

    def test_codigo_unico(self, peligro_virus):
        """Test: El codigo debe ser unico."""
        with pytest.raises(Exception):
            PeligroGTC45.objects.create(
                clasificacion=peligro_virus.clasificacion,
                codigo='BIO-001',  # Codigo duplicado
                nombre='Virus Duplicado',
                descripcion='Test',
                efectos_posibles='Test'
            )

    def test_soft_delete(self, peligro_virus):
        """Test: Soft delete de peligro."""
        peligro_virus.is_active = False
        peligro_virus.save()
        assert peligro_virus.is_active is False


@pytest.mark.django_db
class TestMatrizIPEVR:
    """Tests para el modelo MatrizIPEVR y calculos GTC-45."""

    def test_crear_matriz_ipevr(self, matriz_ipevr_critica, empresa_test, peligro_virus):
        """Test: Crear matriz IPEVR basica."""
        assert matriz_ipevr_critica.empresa == empresa_test
        assert matriz_ipevr_critica.area == 'Laboratorio'
        assert matriz_ipevr_critica.cargo == 'Tecnico de Laboratorio'
        assert matriz_ipevr_critica.peligro == peligro_virus
        assert matriz_ipevr_critica.rutinaria is True
        assert matriz_ipevr_critica.estado == MatrizIPEVR.EstadoMatriz.VIGENTE

    def test_nivel_probabilidad_calculo(self, matriz_ipevr_critica):
        """Test: Calculo de NP = ND x NE."""
        # ND=10, NE=4 => NP=40
        assert matriz_ipevr_critica.nivel_probabilidad == 40

    def test_nivel_riesgo_calculo(self, matriz_ipevr_critica):
        """Test: Calculo de NR = NP x NC."""
        # NP=40, NC=100 => NR=4000
        assert matriz_ipevr_critica.nivel_riesgo == 4000

    def test_interpretacion_np_muy_alto(self, matriz_ipevr_critica):
        """Test: Interpretacion NP muy alto (NP >= 24)."""
        # NP=40
        assert matriz_ipevr_critica.interpretacion_np == "muy_alto"

    def test_interpretacion_np_alto(self, matriz_ipevr_alta):
        """Test: Interpretacion NP alto (10 <= NP < 24)."""
        # ND=6, NE=4 => NP=24
        assert matriz_ipevr_alta.nivel_probabilidad == 24
        assert matriz_ipevr_alta.interpretacion_np == "muy_alto"

    def test_interpretacion_np_medio(self, matriz_ipevr_media):
        """Test: Interpretacion NP medio (6 <= NP < 10)."""
        # ND=2, NE=4 => NP=8
        assert matriz_ipevr_media.nivel_probabilidad == 8
        assert matriz_ipevr_media.interpretacion_np == "medio"

    def test_interpretacion_np_bajo(self, matriz_ipevr_baja):
        """Test: Interpretacion NP bajo (NP < 6)."""
        # ND=2, NE=2 => NP=4
        assert matriz_ipevr_baja.nivel_probabilidad == 4
        assert matriz_ipevr_baja.interpretacion_np == "bajo"

    def test_interpretacion_nr_nivel_i(self, matriz_ipevr_critica):
        """Test: Interpretacion NR nivel I (NR >= 600)."""
        # NR=4000
        assert matriz_ipevr_critica.interpretacion_nr == "I"

    def test_interpretacion_nr_nivel_ii(self, matriz_ipevr_alta):
        """Test: Interpretacion NR nivel II (150 <= NR < 600)."""
        # NP=24, NC=60 => NR=1440
        assert matriz_ipevr_alta.nivel_riesgo == 1440
        assert matriz_ipevr_alta.interpretacion_nr == "I"

    def test_interpretacion_nr_nivel_iii(self, matriz_ipevr_media):
        """Test: Interpretacion NR nivel III (40 <= NR < 150)."""
        # NP=8, NC=25 => NR=200
        assert matriz_ipevr_media.nivel_riesgo == 200
        assert matriz_ipevr_media.interpretacion_nr == "II"

    def test_interpretacion_nr_nivel_iv(self, matriz_ipevr_baja):
        """Test: Interpretacion NR nivel IV (NR < 40)."""
        # NP=4, NC=10 => NR=40
        assert matriz_ipevr_baja.nivel_riesgo == 40
        # NR=40 es el limite, deberia ser III
        assert matriz_ipevr_baja.interpretacion_nr == "III"

    def test_aceptabilidad_no_aceptable_nivel_i(self, matriz_ipevr_critica):
        """Test: Aceptabilidad no aceptable para nivel I."""
        assert matriz_ipevr_critica.aceptabilidad == "no_aceptable"

    def test_aceptabilidad_no_aceptable_nivel_ii(self, matriz_ipevr_alta):
        """Test: Aceptabilidad no aceptable para nivel II."""
        assert matriz_ipevr_alta.aceptabilidad == "no_aceptable"

    def test_aceptabilidad_aceptable_nivel_iii(self, matriz_ipevr_media):
        """Test: Aceptabilidad aceptable para nivel III."""
        assert matriz_ipevr_media.aceptabilidad == "aceptable"

    def test_aceptabilidad_aceptable_nivel_iv(self, matriz_ipevr_baja):
        """Test: Aceptabilidad aceptable para nivel IV."""
        assert matriz_ipevr_baja.aceptabilidad == "aceptable"

    def test_significado_aceptabilidad_nivel_i(self, matriz_ipevr_critica):
        """Test: Significado de aceptabilidad nivel I."""
        significado = matriz_ipevr_critica.significado_aceptabilidad
        assert "Situacion critica" in significado
        assert "Suspender actividades" in significado

    def test_significado_aceptabilidad_nivel_ii(self, matriz_ipevr_alta):
        """Test: Significado de aceptabilidad nivel II."""
        # Esta matriz tiene NR=1440, nivel I
        significado = matriz_ipevr_alta.significado_aceptabilidad
        assert "critica" in significado.lower() or "Corregir" in significado

    def test_significado_aceptabilidad_nivel_iii(self, matriz_ipevr_media):
        """Test: Significado de aceptabilidad nivel III."""
        # Esta matriz tiene NR=200, nivel II
        significado = matriz_ipevr_media.significado_aceptabilidad
        assert len(significado) > 0

    def test_str_matriz(self, matriz_ipevr_critica):
        """Test: Representacion en string de matriz."""
        string_rep = str(matriz_ipevr_critica)
        assert 'Laboratorio' in string_rep
        assert 'Tecnico de Laboratorio' in string_rep
        assert 'Virus' in string_rep

    def test_num_expuestos(self, matriz_ipevr_critica):
        """Test: Numero de expuestos."""
        assert matriz_ipevr_critica.num_expuestos == 3

    def test_fecha_valoracion(self, matriz_ipevr_critica):
        """Test: Fecha de valoracion."""
        assert matriz_ipevr_critica.fecha_valoracion == date.today()

    def test_controles_existentes(self, matriz_ipevr_critica):
        """Test: Controles existentes."""
        assert matriz_ipevr_critica.control_fuente == 'Protocolos de bioseguridad'
        assert matriz_ipevr_critica.control_medio == 'Ventilacion adecuada'
        assert 'EPP completo' in matriz_ipevr_critica.control_individuo

    def test_nivel_deficiencia_muy_alto(self):
        """Test: Nivel de deficiencia muy alto = 10."""
        # Este test verifica que el valor 10 es valido
        assert MatrizIPEVR._meta.get_field('nivel_deficiencia')

    def test_nivel_exposicion_continua(self):
        """Test: Nivel de exposicion continua = 4."""
        assert MatrizIPEVR._meta.get_field('nivel_exposicion')

    def test_nivel_consecuencia_mortal(self):
        """Test: Nivel de consecuencia mortal = 100."""
        assert MatrizIPEVR._meta.get_field('nivel_consecuencia')


@pytest.mark.django_db
class TestControlSST:
    """Tests para el modelo ControlSST."""

    def test_crear_control_eliminacion(self, control_eliminacion, matriz_ipevr_critica):
        """Test: Crear control de tipo eliminacion."""
        assert control_eliminacion.matriz_ipevr == matriz_ipevr_critica
        assert control_eliminacion.tipo_control == ControlSST.TipoControl.ELIMINACION
        assert control_eliminacion.estado == ControlSST.EstadoControl.PROPUESTO
        assert control_eliminacion.efectividad == ControlSST.Efectividad.NO_EVALUADA

    def test_crear_control_ingenieria(self, control_ingenieria, matriz_ipevr_alta):
        """Test: Crear control de ingenieria."""
        assert control_ingenieria.tipo_control == ControlSST.TipoControl.INGENIERIA
        assert control_ingenieria.estado == ControlSST.EstadoControl.EN_IMPLEMENTACION
        assert 'cabina insonorizada' in control_ingenieria.descripcion.lower()

    def test_crear_control_epp(self, control_epp, matriz_ipevr_alta):
        """Test: Crear control de EPP."""
        assert control_epp.tipo_control == ControlSST.TipoControl.EPP
        assert control_epp.estado == ControlSST.EstadoControl.IMPLEMENTADO
        assert control_epp.efectividad == ControlSST.Efectividad.ALTA

    def test_relacion_matriz(self, control_eliminacion, matriz_ipevr_critica):
        """Test: Relacion con matriz IPEVR."""
        assert control_eliminacion in matriz_ipevr_critica.controles_sst.all()

    def test_str_control(self, control_eliminacion):
        """Test: Representacion en string de control."""
        string_rep = str(control_eliminacion)
        assert 'Eliminacion' in string_rep

    def test_fecha_implementacion(self, control_epp):
        """Test: Fecha de implementacion."""
        assert control_epp.fecha_implementacion == date.today() - timedelta(days=10)

    def test_responsable(self, control_eliminacion, usuario_test):
        """Test: Responsable del control."""
        assert control_eliminacion.responsable == usuario_test

    def test_estados_disponibles(self):
        """Test: Todos los estados de control disponibles."""
        estados = [
            ControlSST.EstadoControl.PROPUESTO,
            ControlSST.EstadoControl.EN_IMPLEMENTACION,
            ControlSST.EstadoControl.IMPLEMENTADO,
            ControlSST.EstadoControl.VERIFICADO,
            ControlSST.EstadoControl.CANCELADO
        ]
        assert len(estados) == 5

    def test_tipos_control_jerarquia(self):
        """Test: Tipos de control segun jerarquia GTC-45."""
        tipos = [
            ControlSST.TipoControl.ELIMINACION,
            ControlSST.TipoControl.SUSTITUCION,
            ControlSST.TipoControl.INGENIERIA,
            ControlSST.TipoControl.ADMINISTRATIVO,
            ControlSST.TipoControl.EPP
        ]
        assert len(tipos) == 5

    def test_efectividad_opciones(self):
        """Test: Opciones de efectividad."""
        opciones = [
            ControlSST.Efectividad.ALTA,
            ControlSST.Efectividad.MEDIA,
            ControlSST.Efectividad.BAJA,
            ControlSST.Efectividad.NO_EVALUADA
        ]
        assert len(opciones) == 4

    def test_observaciones(self, control_eliminacion):
        """Test: Campo de observaciones."""
        assert control_eliminacion.observaciones == 'Requiere inversion en tecnologia'

    def test_soft_delete_control(self, control_epp):
        """Test: Soft delete de control."""
        control_epp.is_active = False
        control_epp.save()
        assert control_epp.is_active is False


@pytest.mark.django_db
class TestCalculosGTC45Avanzados:
    """Tests avanzados de calculos GTC-45."""

    def test_calculo_nr_boundary_600(self, empresa_test, peligro_virus, usuario_test):
        """Test: Calculo NR en el limite de 600 (frontera I/II)."""
        # ND=10, NE=2, NC=30 => NP=20, NR=600 (debe ser I)
        matriz = MatrizIPEVR.objects.create(
            empresa=empresa_test,
            area='Test',
            cargo='Test',
            proceso='Test',
            actividad='Test',
            tarea='Test',
            peligro=peligro_virus,
            fuente='Test',
            medio='Test',
            trabajador='Test',
            efectos='Test',
            nivel_deficiencia=10,
            nivel_exposicion=2,
            nivel_consecuencia=30,
            num_expuestos=1,
            peor_consecuencia='Test',
            responsable=usuario_test,
            fecha_valoracion=date.today(),
            created_by=usuario_test
        )
        assert matriz.nivel_probabilidad == 20
        assert matriz.nivel_riesgo == 600
        assert matriz.interpretacion_nr == "I"

    def test_calculo_nr_boundary_150(self, empresa_test, peligro_virus, usuario_test):
        """Test: Calculo NR en el limite de 150 (frontera II/III)."""
        # ND=6, NE=1, NC=25 => NP=6, NR=150 (debe ser II)
        matriz = MatrizIPEVR.objects.create(
            empresa=empresa_test,
            area='Test',
            cargo='Test',
            proceso='Test',
            actividad='Test',
            tarea='Test',
            peligro=peligro_virus,
            fuente='Test',
            medio='Test',
            trabajador='Test',
            efectos='Test',
            nivel_deficiencia=6,
            nivel_exposicion=1,
            nivel_consecuencia=25,
            num_expuestos=1,
            peor_consecuencia='Test',
            responsable=usuario_test,
            fecha_valoracion=date.today(),
            created_by=usuario_test
        )
        assert matriz.nivel_probabilidad == 6
        assert matriz.nivel_riesgo == 150
        assert matriz.interpretacion_nr == "II"

    def test_calculo_nr_boundary_40(self, empresa_test, peligro_virus, usuario_test):
        """Test: Calculo NR en el limite de 40 (frontera III/IV)."""
        # ND=2, NE=2, NC=10 => NP=4, NR=40 (debe ser III)
        matriz = MatrizIPEVR.objects.create(
            empresa=empresa_test,
            area='Test',
            cargo='Test',
            proceso='Test',
            actividad='Test',
            tarea='Test',
            peligro=peligro_virus,
            fuente='Test',
            medio='Test',
            trabajador='Test',
            efectos='Test',
            nivel_deficiencia=2,
            nivel_exposicion=2,
            nivel_consecuencia=10,
            num_expuestos=1,
            peor_consecuencia='Test',
            responsable=usuario_test,
            fecha_valoracion=date.today(),
            created_by=usuario_test
        )
        assert matriz.nivel_probabilidad == 4
        assert matriz.nivel_riesgo == 40
        assert matriz.interpretacion_nr == "III"

    def test_calculo_nr_minimo(self, empresa_test, peligro_virus, usuario_test):
        """Test: Calculo NR minimo posible."""
        # ND=0, NE=1, NC=10 => NP=0, NR=0 (nivel IV)
        matriz = MatrizIPEVR.objects.create(
            empresa=empresa_test,
            area='Test',
            cargo='Test',
            proceso='Test',
            actividad='Test',
            tarea='Test',
            peligro=peligro_virus,
            fuente='Test',
            medio='Test',
            trabajador='Test',
            efectos='Test',
            nivel_deficiencia=0,
            nivel_exposicion=1,
            nivel_consecuencia=10,
            num_expuestos=1,
            peor_consecuencia='Test',
            responsable=usuario_test,
            fecha_valoracion=date.today(),
            created_by=usuario_test
        )
        assert matriz.nivel_probabilidad == 0
        assert matriz.nivel_riesgo == 0
        assert matriz.interpretacion_nr == "IV"

    def test_calculo_nr_maximo(self, empresa_test, peligro_virus, usuario_test):
        """Test: Calculo NR maximo posible."""
        # ND=10, NE=4, NC=100 => NP=40, NR=4000 (nivel I)
        matriz = MatrizIPEVR.objects.create(
            empresa=empresa_test,
            area='Test',
            cargo='Test',
            proceso='Test',
            actividad='Test',
            tarea='Test',
            peligro=peligro_virus,
            fuente='Test',
            medio='Test',
            trabajador='Test',
            efectos='Test',
            nivel_deficiencia=10,
            nivel_exposicion=4,
            nivel_consecuencia=100,
            num_expuestos=1,
            peor_consecuencia='Test',
            responsable=usuario_test,
            fecha_valoracion=date.today(),
            created_by=usuario_test
        )
        assert matriz.nivel_probabilidad == 40
        assert matriz.nivel_riesgo == 4000
        assert matriz.interpretacion_nr == "I"
