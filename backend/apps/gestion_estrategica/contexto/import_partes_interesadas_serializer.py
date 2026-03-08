"""
Serializer de importación masiva de Partes Interesadas desde Excel.
Valida y normaliza una fila del archivo antes de crear la ParteInteresada.
"""
from rest_framework import serializers

from .import_partes_interesadas_utils import (
    NIVEL_INFLUENCIA_MAP,
    NIVEL_INTERES_MAP,
    CANAL_MAP,
    FRECUENCIA_MAP,
    normalizar_valor,
    parsear_bool,
)


class ParteInteresadaImportRowSerializer(serializers.Serializer):
    """
    Valida una fila del Excel de importación y la convierte a datos listos
    para crear una ParteInteresada.

    Resuelve:
    - grupo_nombre → GrupoParteInteresada (get_or_create)
    - subgrupo_nombre → TipoParteInteresada (get_or_create dentro del grupo)
    - nivel_influencia_pi/empresa → choice validado
    - nivel_interes → choice validado
    - canal_principal → choice validado
    - relacionado_sst/ambiental/calidad/pesv → bool
    """
    # Requeridos
    grupo_nombre = serializers.CharField()
    nombre = serializers.CharField()

    # Opcionales
    subgrupo_nombre = serializers.CharField(required=False, allow_blank=True, default='')
    descripcion = serializers.CharField(required=False, allow_blank=True, default='')
    representante = serializers.CharField(required=False, allow_blank=True, default='')
    cargo_representante = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')
    telefono = serializers.CharField(required=False, allow_blank=True, default='')
    direccion = serializers.CharField(required=False, allow_blank=True, default='')
    sitio_web = serializers.CharField(required=False, allow_blank=True, default='')
    temas_interes_pi = serializers.CharField(required=False, allow_blank=True, default='')
    temas_interes_empresa = serializers.CharField(required=False, allow_blank=True, default='')
    nivel_influencia_pi = serializers.CharField(required=False, allow_blank=True, default='')
    nivel_influencia_empresa = serializers.CharField(required=False, allow_blank=True, default='')
    nivel_interes = serializers.CharField(required=False, allow_blank=True, default='')
    canal_principal = serializers.CharField(required=False, allow_blank=True, default='')
    frecuencia_comunicacion = serializers.CharField(required=False, allow_blank=True, default='')
    necesidades = serializers.CharField(required=False, allow_blank=True, default='')
    expectativas = serializers.CharField(required=False, allow_blank=True, default='')
    requisitos_pertinentes = serializers.CharField(required=False, allow_blank=True, default='')
    es_requisito_legal = serializers.CharField(required=False, allow_blank=True, default='')
    relacionado_sst = serializers.CharField(required=False, allow_blank=True, default='')
    relacionado_ambiental = serializers.CharField(required=False, allow_blank=True, default='')
    relacionado_calidad = serializers.CharField(required=False, allow_blank=True, default='')
    relacionado_pesv = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre de la parte interesada es requerido.')
        if len(val) > 200:
            raise serializers.ValidationError('El nombre no puede exceder 200 caracteres.')
        return val

    def validate_grupo_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El grupo es requerido.')
        return val

    def validate(self, attrs):
        from .models import GrupoParteInteresada, TipoParteInteresada, ParteInteresada
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa()

        # ── Resolver Grupo por nombre (get_or_create) ──
        grupo_nombre = str(attrs.get('grupo_nombre', '')).strip()
        if grupo_nombre:
            grupo, _ = GrupoParteInteresada.objects.get_or_create(
                nombre__iexact=grupo_nombre,
                defaults={
                    'nombre': grupo_nombre,
                    'codigo': grupo_nombre.upper().replace(' ', '_')[:30],
                    'es_sistema': False,
                }
            )
            attrs['_grupo'] = grupo
        else:
            raise serializers.ValidationError({
                'grupo_nombre': 'El grupo es requerido.'
            })

        # ── Resolver Tipo/Subgrupo por nombre (get_or_create dentro del grupo) ──
        subgrupo_nombre = str(attrs.get('subgrupo_nombre', '')).strip()
        if subgrupo_nombre:
            tipo, _ = TipoParteInteresada.objects.get_or_create(
                nombre__iexact=subgrupo_nombre,
                grupo=grupo,
                defaults={
                    'nombre': subgrupo_nombre,
                    'codigo': f"{grupo.codigo}_{subgrupo_nombre.upper().replace(' ', '_')[:20]}"[:30],
                    'categoria': 'externo',
                    'es_sistema': False,
                }
            )
            attrs['_tipo'] = tipo
        else:
            # Si no hay subgrupo, usar el primer tipo del grupo
            tipo = TipoParteInteresada.objects.filter(grupo=grupo).first()
            if not tipo:
                # Crear uno genérico
                tipo, _ = TipoParteInteresada.objects.get_or_create(
                    nombre='General',
                    grupo=grupo,
                    defaults={
                        'codigo': f"{grupo.codigo}_GENERAL"[:30],
                        'categoria': 'externo',
                        'es_sistema': False,
                    }
                )
            attrs['_tipo'] = tipo

        # ── Normalizar nivel influencia PI ──
        niv_inf_pi = normalizar_valor(attrs.get('nivel_influencia_pi', ''))
        if niv_inf_pi:
            mapped = NIVEL_INFLUENCIA_MAP.get(niv_inf_pi)
            if mapped:
                attrs['nivel_influencia_pi'] = mapped
            else:
                attrs['nivel_influencia_pi'] = 'media'  # default
        else:
            attrs['nivel_influencia_pi'] = 'media'

        # ── Normalizar nivel influencia Empresa ──
        niv_inf_emp = normalizar_valor(attrs.get('nivel_influencia_empresa', ''))
        if niv_inf_emp:
            mapped = NIVEL_INFLUENCIA_MAP.get(niv_inf_emp)
            if mapped:
                attrs['nivel_influencia_empresa'] = mapped
            else:
                attrs['nivel_influencia_empresa'] = 'media'
        else:
            attrs['nivel_influencia_empresa'] = 'media'

        # ── Normalizar nivel interés ──
        niv_int = normalizar_valor(attrs.get('nivel_interes', ''))
        if niv_int:
            mapped = NIVEL_INTERES_MAP.get(niv_int)
            if mapped:
                attrs['nivel_interes'] = mapped
            else:
                attrs['nivel_interes'] = 'medio'
        else:
            attrs['nivel_interes'] = 'medio'

        # ── Normalizar canal principal ──
        canal = normalizar_valor(attrs.get('canal_principal', ''))
        if canal:
            mapped = CANAL_MAP.get(canal)
            if mapped:
                attrs['canal_principal'] = mapped
            else:
                attrs['canal_principal'] = 'email'
        else:
            attrs['canal_principal'] = 'email'

        # ── Normalizar frecuencia de comunicación ──
        frec = normalizar_valor(attrs.get('frecuencia_comunicacion', ''))
        attrs['frecuencia_comunicacion'] = FRECUENCIA_MAP.get(frec, 'mensual') if frec else 'mensual'

        # ── Limpiar campos de texto libre ──
        for campo in ('cargo_representante', 'email', 'telefono', 'direccion',
                      'sitio_web', 'necesidades', 'expectativas', 'requisitos_pertinentes'):
            attrs[campo] = str(attrs.get(campo, '')).strip()

        # ── Parsear booleanos ──
        attrs['es_requisito_legal'] = parsear_bool(attrs.get('es_requisito_legal', ''))
        attrs['relacionado_sst'] = parsear_bool(attrs.get('relacionado_sst', ''))
        attrs['relacionado_ambiental'] = parsear_bool(attrs.get('relacionado_ambiental', ''))
        attrs['relacionado_calidad'] = parsear_bool(attrs.get('relacionado_calidad', ''))
        attrs['relacionado_pesv'] = parsear_bool(attrs.get('relacionado_pesv', ''))

        # Guardar empresa
        attrs['_empresa'] = empresa

        return attrs
