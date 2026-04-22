"""
Servicio de Generación de Documentos de Contrato - Talent Hub ↔ Gestor Documental
Sprint 20: Integración TH → GD

Genera documentos de contrato laboral usando el sistema de Gestión Documental:
1. Obtiene/crea el TipoDocumento para contratos laborales
2. Busca la PlantillaDocumento por defecto (o la especificada)
3. Renderiza el contenido con variables del contrato
4. Crea un Documento en estado BORRADOR
5. Lo vincula al HistorialContrato
"""
import logging
from string import Template

from django.apps import apps
from django.utils import timezone

logger = logging.getLogger(__name__)


class ContratoDocumentoService:
    """
    Servicio de integración TH → Gestor Documental para contratos laborales.
    """

    # Código del TipoDocumento para contratos laborales
    TIPO_DOC_CODIGO = 'CTR'

    @classmethod
    def generar_documento_contrato(
        cls,
        historial_contrato,
        usuario,
        empresa,
        plantilla_id=None,
    ):
        """
        Genera un Documento de contrato laboral en el Gestor Documental.

        Args:
            historial_contrato: HistorialContrato instance
            usuario: User que genera el documento
            empresa: EmpresaConfig
            plantilla_id: ID de PlantillaDocumento (None = usar default)

        Returns:
            Documento instance (estado=BORRADOR, clasificacion=CONFIDENCIAL)
        """
        Documento = apps.get_model('gestion_documental', 'Documento')
        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')

        # 1. Obtener o crear TipoDocumento
        tipo_doc = cls._get_or_create_tipo_documento(empresa)

        # 2. Obtener plantilla
        plantilla = cls._get_plantilla(tipo_doc, empresa, plantilla_id)

        # 3. Construir variables del contrato
        variables = cls._build_variables(historial_contrato, empresa)

        # 4. Renderizar contenido
        contenido = cls._renderizar_contenido(plantilla, variables)

        # 5. Generar código del documento (patrón cross-module: NO importar de C2)
        codigo = cls._generar_codigo_documento(tipo_doc, empresa.id)

        # 6. Crear Documento
        colaborador = historial_contrato.colaborador
        documento = Documento.objects.create(
            empresa_id=empresa.id,
            codigo=codigo,
            titulo=(
                f'Contrato de Trabajo - {colaborador.get_nombre_completo()} '
                f'({historial_contrato.numero_contrato})'
            ),
            tipo_documento=tipo_doc,
            plantilla=plantilla,
            resumen=(
                f'Contrato {historial_contrato.tipo_contrato.nombre} para '
                f'{colaborador.get_nombre_completo()}, cargo {colaborador.cargo.name}. '
                f'Inicio: {historial_contrato.fecha_inicio}'
            ),
            contenido=contenido,
            datos_formulario={
                'source': 'talent_hub_contratacion',
                'historial_contrato_id': historial_contrato.id,
                'colaborador_id': colaborador.id,
                'tipo_contrato': historial_contrato.tipo_contrato.codigo,
                'salario_pactado': str(historial_contrato.salario_pactado),
                'fecha_inicio': str(historial_contrato.fecha_inicio),
                'fecha_fin': str(historial_contrato.fecha_fin) if historial_contrato.fecha_fin else None,
            },
            palabras_clave=[
                'contrato', 'laboral', 'talent-hub',
                colaborador.numero_identificacion,
                historial_contrato.numero_contrato,
            ],
            estado='BORRADOR',
            clasificacion='CONFIDENCIAL',
            elaborado_por=usuario,
        )

        # 7. Vincular al HistorialContrato
        historial_contrato.contrato_documento = documento
        historial_contrato.save(update_fields=['contrato_documento'])

        logger.info(
            f"Documento de contrato generado: {codigo} para "
            f"{colaborador.get_nombre_completo()}"
        )

        return documento

    @classmethod
    def _get_or_create_tipo_documento(cls, empresa):
        """Obtiene o crea el TipoDocumento para contratos laborales."""
        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')

        tipo_doc, created = TipoDocumento.objects.get_or_create(
            empresa_id=empresa.id,
            codigo=cls.TIPO_DOC_CODIGO,
            defaults={
                'nombre': 'Contrato de Trabajo',
                'descripcion': 'Contratos laborales de colaboradores',
                'nivel_documento': 'OPERATIVO',
                'prefijo_codigo': 'CTR-',
                'requiere_aprobacion': True,
                'requiere_firma': True,
                'tiempo_retencion_años': 20,
                'color_identificacion': '#6366f1',
                'is_active': True,
                'orden': 100,
                'created_by': None,
            }
        )

        if created:
            logger.info(f"TipoDocumento '{cls.TIPO_DOC_CODIGO}' creado para empresa {empresa.id}")

        return tipo_doc

    @classmethod
    def _get_plantilla(cls, tipo_doc, empresa, plantilla_id=None):
        """
        Obtiene la plantilla de documento.

        Prioridad:
        1. plantilla_id específica
        2. Plantilla por defecto del tipo de documento
        3. None (sin plantilla - usa contenido generado)
        """
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')

        if plantilla_id:
            try:
                return PlantillaDocumento.objects.get(
                    pk=plantilla_id, estado='ACTIVA'
                )
            except PlantillaDocumento.DoesNotExist:
                logger.warning(f"Plantilla #{plantilla_id} no encontrada, usando default")

        # Buscar plantilla por defecto
        return PlantillaDocumento.objects.filter(
            tipo_documento=tipo_doc,
            empresa_id=empresa.id,
            es_por_defecto=True,
            estado='ACTIVA',
        ).first()

    @classmethod
    def _build_variables(cls, historial_contrato, empresa) -> dict:
        """Construye el diccionario de variables para la plantilla."""
        colaborador = historial_contrato.colaborador
        # C1: acceder a EmpresaConfig via apps.get_model (no import directo)
        EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')

        # Obtener datos de la empresa
        try:
            empresa_config = EmpresaConfig.objects.first()
            empresa_nombre = getattr(empresa_config, 'nombre', 'N/A')
            empresa_nit = getattr(empresa_config, 'nit', 'N/A')
            empresa_direccion = getattr(empresa_config, 'direccion', 'N/A')
            empresa_ciudad = getattr(empresa_config, 'ciudad', 'N/A')
        except Exception:
            empresa_nombre = 'N/A'
            empresa_nit = 'N/A'
            empresa_direccion = 'N/A'
            empresa_ciudad = 'N/A'

        fecha_fin_str = (
            str(historial_contrato.fecha_fin)
            if historial_contrato.fecha_fin
            else 'Indefinido'
        )

        return {
            # Empresa
            'empresa_nombre': empresa_nombre,
            'empresa_nit': empresa_nit,
            'empresa_direccion': empresa_direccion,
            'empresa_ciudad': empresa_ciudad,
            # Colaborador
            'colaborador_nombre': colaborador.get_nombre_completo(),
            'tipo_documento': colaborador.get_tipo_documento_display(),
            'numero_identificacion': colaborador.numero_identificacion,
            # Contrato
            'tipo_contrato': historial_contrato.tipo_contrato.nombre,
            'numero_contrato': historial_contrato.numero_contrato,
            'cargo': colaborador.cargo.name,
            'area': colaborador.area.name if colaborador.area else 'N/A',
            'salario_pactado': f"${historial_contrato.salario_pactado:,.2f}",
            'fecha_inicio': str(historial_contrato.fecha_inicio),
            'fecha_fin': fecha_fin_str,
            'objeto_contrato': historial_contrato.objeto_contrato or 'N/A',
            'justificacion': historial_contrato.justificacion_tipo_contrato or '',
            # Meta
            'fecha_generacion': str(timezone.now().date()),
        }

    @classmethod
    def _renderizar_contenido(cls, plantilla, variables) -> str:
        """
        Renderiza el contenido de la plantilla con las variables.

        Si hay plantilla, usa su contenido_plantilla.
        Si no, genera un HTML básico con los datos del contrato.
        """
        if plantilla and plantilla.contenido_plantilla:
            try:
                # Usar Template de Python (safe_substitute para no fallar con vars faltantes)
                template = Template(plantilla.contenido_plantilla)
                return template.safe_substitute(variables)
            except Exception as e:
                logger.warning(f"Error renderizando plantilla: {e}. Usando fallback.")

        # Fallback: generar HTML básico
        return cls._generar_contenido_basico(variables)

    @classmethod
    def _generar_codigo_documento(cls, tipo_doc, empresa_id=None) -> str:
        """
        Genera código único para documento de contrato (Sistema A, scan).

        empresa_id es legacy (pre-django-tenants). Multi-tenant hoy se
        maneja via `schema_context`; el queryset filtra por schema activo.
        """
        Documento = apps.get_model('gestion_documental', 'Documento')
        prefijo = tipo_doc.prefijo_codigo or f'{tipo_doc.codigo}-'
        # Normalizar separator: el prefijo del tipo ya incluye '-', así que
        # pasamos separator='' y un prefix terminado en '-' para preservarlo.
        # En su defecto, usamos el helper estándar con separator='-'.
        ultimo = Documento.objects.filter(
            codigo__startswith=prefijo
        ).order_by('-codigo').first()
        if ultimo:
            try:
                ultimo_num = int(ultimo.codigo.replace(prefijo, ''))
                nuevo_num = ultimo_num + 1
            except (ValueError, IndexError):
                nuevo_num = 1
        else:
            nuevo_num = 1
        return f'{prefijo}{nuevo_num:04d}'

    @classmethod
    def _generar_contenido_basico(cls, variables) -> str:
        """Genera un documento HTML básico de contrato laboral."""
        return f"""
<div class="contrato-laboral">
    <h1 style="text-align: center;">CONTRATO DE TRABAJO</h1>

    <p>
        Entre <strong>{variables['empresa_nombre']}</strong>,
        identificada con NIT <strong>{variables['empresa_nit']}</strong>,
        con domicilio en {variables['empresa_ciudad']},
        en adelante EL EMPLEADOR, y
        <strong>{variables['colaborador_nombre']}</strong>,
        identificado/a con {variables['tipo_documento']}
        No. <strong>{variables['numero_identificacion']}</strong>,
        en adelante EL TRABAJADOR, se celebra el presente contrato de trabajo
        regido por las siguientes cláusulas:
    </p>

    <h2>PRIMERA — TIPO DE CONTRATO</h2>
    <p>
        El presente contrato es de tipo <strong>{variables['tipo_contrato']}</strong>.
        Número de contrato: <strong>{variables['numero_contrato']}</strong>.
    </p>

    <h2>SEGUNDA — OBJETO</h2>
    <p>
        EL TRABAJADOR se obliga a prestar sus servicios personales en el cargo de
        <strong>{variables['cargo']}</strong>, en el área de
        <strong>{variables['area']}</strong>.
    </p>
    <p>{variables['objeto_contrato']}</p>

    <h2>TERCERA — REMUNERACIÓN</h2>
    <p>
        EL EMPLEADOR pagará al TRABAJADOR un salario mensual de
        <strong>{variables['salario_pactado']} COP</strong>,
        pagadero en los períodos y forma establecidos por la empresa.
    </p>

    <h2>CUARTA — DURACIÓN</h2>
    <p>
        Fecha de inicio: <strong>{variables['fecha_inicio']}</strong>.<br>
        Fecha de finalización: <strong>{variables['fecha_fin']}</strong>.
    </p>

    <h2>QUINTA — OBLIGACIONES</h2>
    <p>
        Las partes se comprometen a cumplir con las obligaciones establecidas
        en el Código Sustantivo del Trabajo, el Reglamento Interno de Trabajo
        y las normas que regulan la relación laboral.
    </p>

    <br><br>
    <p>
        Para constancia se firma en {variables['empresa_ciudad']},
        a los {variables['fecha_generacion']}.
    </p>

    <br><br>
    <div style="display: flex; justify-content: space-between;">
        <div style="text-align: center;">
            <hr style="width: 200px;">
            <p><strong>EL EMPLEADOR</strong></p>
            <p>{variables['empresa_nombre']}</p>
            <p>NIT: {variables['empresa_nit']}</p>
        </div>
        <div style="text-align: center;">
            <hr style="width: 200px;">
            <p><strong>EL TRABAJADOR</strong></p>
            <p>{variables['colaborador_nombre']}</p>
            <p>{variables['tipo_documento']}: {variables['numero_identificacion']}</p>
        </div>
    </div>
</div>
"""
