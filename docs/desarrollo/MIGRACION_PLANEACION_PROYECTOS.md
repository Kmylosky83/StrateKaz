# Plan de Migración: Planeación Estratégica → Proyectos PMI

**Fecha**: 2026-01-23
**Autor**: Claude Sonnet 4.5 - Data Architect
**Tipo**: Plan de Migración Técnico
**Relacionado**: ANALISIS_ARQUITECTURA_DATOS_PLANEACION_PMI.md, DIAGRAMA_FLUJO_DATOS_ESTRATEGICO.md

---

## 1. OBJETIVO DE LA MIGRACIÓN

Vincular relacionalmente los módulos de **Planeación Estratégica** y **Proyectos PMI** para habilitar:

1. Rastreo de alineación estratégica de proyectos
2. Medición de cumplimiento de objetivos mediante proyectos
3. Priorización de proyectos por impacto estratégico
4. Consolidación de riesgos corporativos vs riesgos de proyecto
5. Vinculación de partes interesadas corporativas con proyectos

---

## 2. FASE 1: PREPARACIÓN (Día 1-2)

### 2.1 Backup de Base de Datos

```bash
# Crear backup completo antes de cualquier cambio
cd c:\Proyectos\StrateKaz

# Windows (cmd)
python backend/manage.py dumpdata > backup_pre_migration_$(date +%Y%m%d_%H%M%S).json

# O usar PostgreSQL dump (si aplica)
pg_dump -U postgres -h localhost stratekaz_db > backup_pre_migration.sql
```

### 2.2 Análisis de Datos Existentes

```python
# backend/scripts/analizar_datos_migracion.py

"""
Script de análisis previo a la migración.

Identifica:
- Cantidad de portafolios con objetivo_estrategico (TextField)
- Cantidad de proyectos existentes
- Patrones en campos de texto para mapeo automático
"""

from apps.gestion_estrategica.gestion_proyectos.models import Portafolio, Proyecto
from apps.gestion_estrategica.planeacion.models import StrategicObjective
import re


def analizar_portafolios():
    """Analiza campos objetivo_estrategico en Portafolios"""
    total = Portafolio.objects.count()
    con_objetivo = Portafolio.objects.exclude(
        objetivo_estrategico__isnull=True
    ).exclude(objetivo_estrategico='').count()

    print(f"=== ANÁLISIS DE PORTAFOLIOS ===")
    print(f"Total de portafolios: {total}")
    print(f"Con objetivo_estrategico: {con_objetivo} ({con_objetivo/total*100:.1f}%)")
    print(f"Sin objetivo_estrategico: {total - con_objetivo}")

    # Buscar patrones de códigos OE-XXX
    portafolios = Portafolio.objects.exclude(objetivo_estrategico='')
    codigos_encontrados = 0

    for p in portafolios:
        codigos = re.findall(r'OE-\d+', p.objetivo_estrategico)
        if codigos:
            codigos_encontrados += 1
            print(f"  {p.codigo}: {codigos}")

    print(f"\nPortafolios con códigos OE-XXX: {codigos_encontrados}")

    return {
        'total': total,
        'con_objetivo': con_objetivo,
        'codigos_encontrados': codigos_encontrados
    }


def analizar_objetivos():
    """Analiza objetivos estratégicos disponibles"""
    total = StrategicObjective.objects.filter(is_active=True).count()

    print(f"\n=== ANÁLISIS DE OBJETIVOS ESTRATÉGICOS ===")
    print(f"Total de objetivos activos: {total}")

    # Objetivos por perspectiva
    from django.db.models import Count
    perspectivas = StrategicObjective.objects.filter(
        is_active=True
    ).values('bsc_perspective').annotate(
        count=Count('id')
    ).order_by('bsc_perspective')

    print("\nObjetivos por perspectiva BSC:")
    for p in perspectivas:
        print(f"  {p['bsc_perspective']}: {p['count']}")

    return {'total': total, 'perspectivas': list(perspectivas)}


def analizar_proyectos():
    """Analiza proyectos existentes"""
    total = Proyecto.objects.count()
    activos = Proyecto.objects.filter(is_active=True).count()

    print(f"\n=== ANÁLISIS DE PROYECTOS ===")
    print(f"Total de proyectos: {total}")
    print(f"Proyectos activos: {activos}")

    # Proyectos por estado
    from django.db.models import Count
    estados = Proyecto.objects.values('estado').annotate(
        count=Count('id')
    ).order_by('-count')

    print("\nProyectos por estado:")
    for e in estados:
        print(f"  {e['estado']}: {e['count']}")

    return {'total': total, 'activos': activos, 'estados': list(estados)}


def generar_reporte():
    """Genera reporte completo de análisis"""
    print("=" * 70)
    print("REPORTE DE ANÁLISIS PRE-MIGRACIÓN")
    print("=" * 70)

    portafolios = analizar_portafolios()
    objetivos = analizar_objetivos()
    proyectos = analizar_proyectos()

    # Estimación de migración exitosa
    print(f"\n=== ESTIMACIÓN DE ÉXITO DE MIGRACIÓN ===")
    if portafolios['codigos_encontrados'] > 0:
        exito_estimado = (
            portafolios['codigos_encontrados'] / portafolios['con_objetivo'] * 100
        )
        print(f"Portafolios con códigos parseables: {exito_estimado:.1f}%")
    else:
        print("⚠️ NO se encontraron códigos OE-XXX en campos de texto")
        print("   La migración requerirá mapeo manual o lógica personalizada")

    print(f"\nObjetivos disponibles para vinculación: {objetivos['total']}")
    print(f"Proyectos que recibirán vinculación: {proyectos['total']}")


if __name__ == '__main__':
    generar_reporte()
```

**Ejecutar análisis**:
```bash
cd c:\Proyectos\StrateKaz
python backend/scripts/analizar_datos_migracion.py
```

---

## 3. FASE 2: CREACIÓN DE MIGRACIONES (Día 3-4)

### 3.1 Migración 1: Agregar Campos Nuevos a Portafolio

```python
# backend/apps/gestion_estrategica/gestion_proyectos/migrations/0002_add_strategic_links.py

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0001_initial'),
        ('planeacion', '0002_strategicobjective_areas_responsables'),
    ]

    operations = [
        # =====================================================================
        # PORTAFOLIO: Agregar ManyToMany a StrategicObjective
        # =====================================================================
        migrations.AddField(
            model_name='portafolio',
            name='objetivos_estrategicos',
            field=models.ManyToManyField(
                blank=True,
                related_name='portafolios',
                to='planeacion.StrategicObjective',
                verbose_name='Objetivos Estratégicos',
                help_text='Objetivos del BSC que este portafolio apoya',
                db_table='gestion_proyectos_portafolio_objetivos'
            ),
        ),

        # Renombrar campo antiguo a *_legacy
        migrations.RenameField(
            model_name='portafolio',
            old_name='objetivo_estrategico',
            new_name='objetivo_estrategico_legacy',
        ),

        # Agregar ayuda de migración
        migrations.AlterField(
            model_name='portafolio',
            name='objetivo_estrategico_legacy',
            field=models.TextField(
                blank=True,
                verbose_name='[DEPRECATED] Objetivo Estratégico (texto)',
                help_text='Campo legacy. Usar objetivos_estrategicos (ManyToMany).'
            ),
        ),

        # Crear índice para queries
        migrations.AddIndex(
            model_name='portafolio',
            index=models.Index(
                fields=['empresa', 'is_active'],
                name='portafolio_emp_act_idx'
            ),
        ),
    ]
```

### 3.2 Migración 2: Agregar Campos Nuevos a Programa y Proyecto

```python
# backend/apps/gestion_estrategica/gestion_proyectos/migrations/0003_add_strategic_links_proyecto.py

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0002_add_strategic_links'),
        ('planeacion', '0002_strategicobjective_areas_responsables'),
        ('contexto', '0002_estrategiatows_area_responsable_and_more'),
        ('core', '0001_initial'),
    ]

    operations = [
        # =====================================================================
        # PROGRAMA: Agregar ManyToMany a StrategicObjective
        # =====================================================================
        migrations.AddField(
            model_name='programa',
            name='objetivos_estrategicos',
            field=models.ManyToManyField(
                blank=True,
                related_name='programas',
                to='planeacion.StrategicObjective',
                verbose_name='Objetivos Estratégicos',
                db_table='gestion_proyectos_programa_objetivos'
            ),
        ),

        # =====================================================================
        # PROYECTO: Agregar ManyToMany a StrategicObjective
        # =====================================================================
        migrations.AddField(
            model_name='proyecto',
            name='objetivos_estrategicos',
            field=models.ManyToManyField(
                blank=True,
                related_name='proyectos_asociados',
                to='planeacion.StrategicObjective',
                verbose_name='Objetivos Estratégicos',
                help_text='Objetivos del plan estratégico que este proyecto apoya',
                db_table='gestion_proyectos_proyecto_objetivos'
            ),
        ),

        # =====================================================================
        # PROYECTO: Agregar FK a EstrategiaTOWS
        # =====================================================================
        migrations.AddField(
            model_name='proyecto',
            name='estrategia_origen',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proyectos_derivados',
                to='contexto.EstrategiaTOWS',
                verbose_name='Estrategia TOWS Origen',
                help_text='Estrategia TOWS que originó este proyecto (si aplica)',
                db_index=True
            ),
        ),

        # =====================================================================
        # PROYECTO: Agregar campos de cargo (normalización)
        # =====================================================================
        migrations.AddField(
            model_name='proyecto',
            name='sponsor_cargo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proyectos_sponsor_cargo',
                to='core.Cargo',
                verbose_name='Cargo del Sponsor'
            ),
        ),
        migrations.AddField(
            model_name='proyecto',
            name='gerente_cargo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proyectos_gerente_cargo',
                to='core.Cargo',
                verbose_name='Cargo del Gerente'
            ),
        ),

        # =====================================================================
        # ÍNDICES
        # =====================================================================
        migrations.AddIndex(
            model_name='proyecto',
            index=models.Index(
                fields=['estrategia_origen'],
                name='proy_estrategia_idx'
            ),
        ),
    ]
```

### 3.3 Migración 3: Vincular Riesgos y Partes Interesadas

```python
# backend/apps/gestion_estrategica/gestion_proyectos/migrations/0004_add_risk_stakeholder_links.py

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0003_add_strategic_links_proyecto'),
        ('motor_riesgos', '0001_initial'),
        ('motor_cumplimiento', '0001_initial'),
    ]

    operations = [
        # =====================================================================
        # RIESGOPROYECTO: Agregar FK a Risk (Motor de Riesgos)
        # =====================================================================
        migrations.AddField(
            model_name='riesgoproyecto',
            name='riesgo_corporativo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='riesgos_proyecto',
                to='motor_riesgos.Risk',
                verbose_name='Riesgo Corporativo',
                help_text='Riesgo corporativo al que se vincula (si aplica)',
                db_index=True
            ),
        ),

        migrations.AddIndex(
            model_name='riesgoproyecto',
            index=models.Index(
                fields=['riesgo_corporativo', 'is_materializado'],
                name='riesgo_proy_corp_mat_idx'
            ),
        ),

        # =====================================================================
        # INTERESADOPROYECTO: Agregar FK a ParteInteresada
        # =====================================================================
        migrations.AddField(
            model_name='interesadoproyecto',
            name='parte_interesada',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proyectos',
                to='motor_cumplimiento.ParteInteresada',
                verbose_name='Parte Interesada Corporativa',
                help_text='Referencia al registro central de partes interesadas',
                db_index=True
            ),
        ),
    ]
```

---

## 4. FASE 3: MIGRACIÓN DE DATOS (Día 5-6)

### 4.1 Script de Migración de Portafolios

```python
# backend/apps/gestion_estrategica/gestion_proyectos/migrations/0005_migrate_portafolio_data.py

from django.db import migrations
import re


def migrate_portafolio_objetivos(apps, schema_editor):
    """
    Migra Portafolio.objetivo_estrategico_legacy (TextField)
    a Portafolio.objetivos_estrategicos (ManyToMany).

    Estrategias de mapeo:
    1. Buscar códigos OE-XXX en el texto
    2. Buscar por nombre parcial (fuzzy matching)
    3. Si no encuentra, registrar en log para mapeo manual
    """
    Portafolio = apps.get_model('gestion_proyectos', 'Portafolio')
    StrategicObjective = apps.get_model('planeacion', 'StrategicObjective')

    total = 0
    exito = 0
    fallido = 0
    vacio = 0

    log_fallidos = []

    for portafolio in Portafolio.objects.all():
        total += 1

        if not portafolio.objetivo_estrategico_legacy:
            vacio += 1
            continue

        texto = portafolio.objetivo_estrategico_legacy

        # Estrategia 1: Buscar códigos OE-XXX
        codigos = re.findall(r'OE-\d+', texto, re.IGNORECASE)

        objetivos_encontrados = []

        if codigos:
            # Buscar objetivos por código
            for codigo in codigos:
                obj = StrategicObjective.objects.filter(
                    code__iexact=codigo,
                    is_active=True
                ).first()
                if obj:
                    objetivos_encontrados.append(obj)

        # Estrategia 2: Buscar por nombre (si no encontró por código)
        if not objetivos_encontrados:
            # Buscar palabras clave en el texto
            palabras_clave = [
                palabra for palabra in texto.split()
                if len(palabra) > 3  # Palabras de más de 3 letras
            ]

            if palabras_clave:
                # Buscar objetivos que contengan estas palabras
                from django.db.models import Q
                query = Q()
                for palabra in palabras_clave[:5]:  # Máximo 5 palabras
                    query |= Q(name__icontains=palabra)

                objetivos = StrategicObjective.objects.filter(
                    query, is_active=True
                )[:3]  # Máximo 3 resultados

                objetivos_encontrados = list(objetivos)

        # Vincular objetivos encontrados
        if objetivos_encontrados:
            portafolio.objetivos_estrategicos.set(objetivos_encontrados)
            exito += 1
        else:
            fallido += 1
            log_fallidos.append({
                'codigo': portafolio.codigo,
                'nombre': portafolio.nombre,
                'texto_original': texto
            })

    # Imprimir reporte
    print(f"\n{'='*70}")
    print("REPORTE DE MIGRACIÓN DE PORTAFOLIOS")
    print(f"{'='*70}")
    print(f"Total procesados: {total}")
    print(f"Exitosos: {exito} ({exito/total*100:.1f}%)")
    print(f"Fallidos: {fallido} ({fallido/total*100:.1f}%)")
    print(f"Vacíos: {vacio} ({vacio/total*100:.1f}%)")

    if log_fallidos:
        print(f"\n{'='*70}")
        print("PORTAFOLIOS CON MIGRACIÓN FALLIDA (requieren mapeo manual)")
        print(f"{'='*70}")
        for item in log_fallidos:
            print(f"\nCódigo: {item['codigo']}")
            print(f"Nombre: {item['nombre']}")
            print(f"Texto original: {item['texto_original'][:100]}...")


def reverse_migration(apps, schema_editor):
    """
    Revertir migración (limpiar relaciones ManyToMany).

    NOTA: El texto original se preserva en objetivo_estrategico_legacy,
    por lo que la reversión es segura.
    """
    Portafolio = apps.get_model('gestion_proyectos', 'Portafolio')

    for portafolio in Portafolio.objects.all():
        portafolio.objetivos_estrategicos.clear()


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0004_add_risk_stakeholder_links'),
    ]

    operations = [
        migrations.RunPython(
            migrate_portafolio_objetivos,
            reverse_migration
        ),
    ]
```

### 4.2 Validación Post-Migración

```python
# backend/scripts/validar_migracion.py

"""
Script de validación post-migración.

Verifica:
- Cantidad de portafolios con objetivos vinculados
- Integridad referencial
- Casos de borde
"""

from apps.gestion_estrategica.gestion_proyectos.models import Portafolio, Proyecto
from apps.gestion_estrategica.planeacion.models import StrategicObjective


def validar_portafolios():
    """Valida migración de portafolios"""
    total = Portafolio.objects.count()
    con_objetivos = Portafolio.objects.annotate(
        num_objetivos=Count('objetivos_estrategicos')
    ).filter(num_objetivos__gt=0).count()

    print(f"=== VALIDACIÓN DE PORTAFOLIOS ===")
    print(f"Total de portafolios: {total}")
    print(f"Con objetivos vinculados: {con_objetivos} ({con_objetivos/total*100:.1f}%)")

    # Verificar integridad referencial
    from django.db.models import Count

    objetivos_huerfanos = StrategicObjective.objects.annotate(
        num_portafolios=Count('portafolios')
    ).filter(num_portafolios__gt=5)  # Objetivos con >5 portafolios (posible error)

    if objetivos_huerfanos.exists():
        print(f"\n⚠️ ADVERTENCIA: {objetivos_huerfanos.count()} objetivos con >5 portafolios")
        for obj in objetivos_huerfanos[:5]:
            print(f"  {obj.code}: {obj.portafolios.count()} portafolios")

    # Verificar preservación de datos legacy
    con_legacy = Portafolio.objects.exclude(
        objetivo_estrategico_legacy__isnull=True
    ).exclude(objetivo_estrategico_legacy='').count()

    print(f"\nCon datos legacy preservados: {con_legacy}")

    return {
        'total': total,
        'con_objetivos': con_objetivos,
        'con_legacy': con_legacy
    }


def validar_objetivos_accesibles():
    """Valida que los objetivos vinculados sean accesibles"""
    print(f"\n=== VALIDACIÓN DE ACCESIBILIDAD ===")

    # Probar query: Portafolios de perspectiva Financiera
    from django.db.models import Q

    portafolios_financieros = Portafolio.objects.filter(
        objetivos_estrategicos__bsc_perspective='FINANCIERA'
    ).distinct()

    print(f"Portafolios de perspectiva Financiera: {portafolios_financieros.count()}")

    # Probar query inversa: Objetivos con portafolios
    objetivos_con_portafolios = StrategicObjective.objects.annotate(
        num_portafolios=Count('portafolios')
    ).filter(num_portafolios__gt=0)

    print(f"Objetivos con portafolios: {objetivos_con_portafolios.count()}")

    # Verificar que las queries funcionan
    try:
        for p in portafolios_financieros[:5]:
            objetivos = p.objetivos_estrategicos.all()
            print(f"  {p.codigo}: {objetivos.count()} objetivos")
        print("✅ Queries funcionando correctamente")
    except Exception as e:
        print(f"❌ ERROR en queries: {e}")


if __name__ == '__main__':
    validar_portafolios()
    validar_objetivos_accesibles()
```

**Ejecutar validación**:
```bash
cd c:\Proyectos\StrateKaz
python backend/scripts/validar_migracion.py
```

---

## 5. FASE 4: ACTUALIZACIÓN DE CÓDIGO (Día 7-10)

### 5.1 Serializers

```python
# backend/apps/gestion_estrategica/gestion_proyectos/serializers.py

from rest_framework import serializers
from .models import Portafolio, Programa, Proyecto
from apps.gestion_estrategica.planeacion.models import StrategicObjective


class PortafolioSerializer(serializers.ModelSerializer):
    """Serializer para Portafolio con objetivos estratégicos"""

    # Nested read para mostrar objetivos completos
    objetivos_estrategicos_detail = serializers.SerializerMethodField()

    # Write para crear/actualizar (solo IDs)
    objetivos_estrategicos = serializers.PrimaryKeyRelatedField(
        queryset=StrategicObjective.objects.filter(is_active=True),
        many=True,
        required=False,
        allow_null=True
    )

    # Campos calculados
    num_objetivos = serializers.SerializerMethodField()
    perspectivas_bsc = serializers.SerializerMethodField()

    class Meta:
        model = Portafolio
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'objetivos_estrategicos', 'objetivos_estrategicos_detail',
            'num_objetivos', 'perspectivas_bsc',
            'presupuesto_asignado', 'responsable',
            'fecha_inicio', 'fecha_fin',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['num_objetivos', 'perspectivas_bsc']

    def get_objetivos_estrategicos_detail(self, obj):
        """Retorna objetivos estratégicos con detalles"""
        objetivos = obj.objetivos_estrategicos.all()
        return [{
            'id': o.id,
            'code': o.code,
            'name': o.name,
            'bsc_perspective': o.bsc_perspective,
            'progress': o.progress,
            'status': o.status
        } for o in objetivos]

    def get_num_objetivos(self, obj):
        """Número de objetivos vinculados"""
        return obj.objetivos_estrategicos.count()

    def get_perspectivas_bsc(self, obj):
        """Lista de perspectivas BSC cubiertas"""
        return list(obj.objetivos_estrategicos.values_list(
            'bsc_perspective', flat=True
        ).distinct())


class ProyectoSerializer(serializers.ModelSerializer):
    """Serializer para Proyecto con objetivos estratégicos y estrategia origen"""

    # Nested read
    objetivos_estrategicos_detail = serializers.SerializerMethodField()
    estrategia_origen_detail = serializers.SerializerMethodField()

    # Write (solo IDs)
    objetivos_estrategicos = serializers.PrimaryKeyRelatedField(
        queryset=StrategicObjective.objects.filter(is_active=True),
        many=True,
        required=False,
        allow_null=True
    )

    # Campos calculados
    perspectivas_bsc_cubiertas = serializers.SerializerMethodField()
    normas_iso_aplicables = serializers.SerializerMethodField()

    class Meta:
        model = Proyecto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'tipo', 'estado', 'prioridad',
            'objetivos_estrategicos', 'objetivos_estrategicos_detail',
            'estrategia_origen', 'estrategia_origen_detail',
            'perspectivas_bsc_cubiertas', 'normas_iso_aplicables',
            'fecha_propuesta', 'fecha_inicio_plan', 'fecha_fin_plan',
            'presupuesto_estimado', 'presupuesto_aprobado', 'costo_real',
            'porcentaje_avance', 'sponsor', 'gerente_proyecto',
            'sponsor_cargo', 'gerente_cargo',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_objetivos_estrategicos_detail(self, obj):
        """Retorna objetivos estratégicos con detalles"""
        objetivos = obj.objetivos_estrategicos.all()
        return [{
            'id': o.id,
            'code': o.code,
            'name': o.name,
            'bsc_perspective': o.bsc_perspective,
            'bsc_perspective_display': o.get_bsc_perspective_display(),
            'progress': o.progress,
            'status': o.status
        } for o in objetivos]

    def get_estrategia_origen_detail(self, obj):
        """Retorna estrategia TOWS de origen"""
        if not obj.estrategia_origen:
            return None

        estrategia = obj.estrategia_origen
        return {
            'id': estrategia.id,
            'tipo': estrategia.tipo,
            'tipo_display': estrategia.get_tipo_display(),
            'descripcion': estrategia.descripcion,
            'objetivo': estrategia.objetivo,
            'prioridad': estrategia.prioridad,
            'estado': estrategia.estado
        }

    def get_perspectivas_bsc_cubiertas(self, obj):
        """Lista de perspectivas BSC que este proyecto cubre"""
        return list(obj.objetivos_estrategicos.values_list(
            'bsc_perspective', flat=True
        ).distinct())

    def get_normas_iso_aplicables(self, obj):
        """Normas ISO aplicables según objetivos vinculados"""
        from apps.gestion_estrategica.configuracion.models import NormaISO
        normas = NormaISO.objects.filter(
            objetivos_estrategicos__in=obj.objetivos_estrategicos.all()
        ).distinct()

        return [{
            'id': n.id,
            'code': n.code,
            'short_name': n.short_name,
            'full_name': n.full_name
        } for n in normas]
```

### 5.2 ViewSets

```python
# backend/apps/gestion_estrategica/gestion_proyectos/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from .models import Portafolio, Programa, Proyecto
from .serializers import PortafolioSerializer, ProgramaSerializer, ProyectoSerializer


class PortafolioViewSet(viewsets.ModelViewSet):
    """ViewSet para Portafolios"""

    queryset = Portafolio.objects.all()
    serializer_class = PortafolioSerializer

    def get_queryset(self):
        """Filtros personalizados"""
        queryset = super().get_queryset()

        # Filtro por perspectiva BSC
        perspectiva = self.request.query_params.get('perspectiva', None)
        if perspectiva:
            queryset = queryset.filter(
                objetivos_estrategicos__bsc_perspective=perspectiva
            ).distinct()

        # Filtro por objetivo específico
        objetivo_id = self.request.query_params.get('objetivo_id', None)
        if objetivo_id:
            queryset = queryset.filter(
                objetivos_estrategicos__id=objetivo_id
            )

        return queryset

    @action(detail=False, methods=['get'])
    def cobertura_estrategica(self, request):
        """
        Endpoint: /api/portafolios/cobertura_estrategica/

        Retorna cobertura de objetivos estratégicos por portafolios.
        """
        portafolios = self.get_queryset().annotate(
            num_objetivos=Count('objetivos_estrategicos'),
            num_programas=Count('programas'),
            num_proyectos=Count('programas__proyectos'),
            presupuesto_total=Sum('programas__proyectos__presupuesto_aprobado')
        )

        data = []
        for p in portafolios:
            data.append({
                'codigo': p.codigo,
                'nombre': p.nombre,
                'num_objetivos': p.num_objetivos,
                'num_programas': p.num_programas,
                'num_proyectos': p.num_proyectos,
                'presupuesto_total': p.presupuesto_total or 0,
                'objetivos': list(p.objetivos_estrategicos.values(
                    'id', 'code', 'name', 'bsc_perspective'
                ))
            })

        return Response(data)


class ProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para Proyectos"""

    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer

    def get_queryset(self):
        """Filtros personalizados"""
        queryset = super().get_queryset()

        # Filtro por objetivo estratégico
        objetivo_id = self.request.query_params.get('objetivo_id', None)
        if objetivo_id:
            queryset = queryset.filter(
                objetivos_estrategicos__id=objetivo_id
            ).distinct()

        # Filtro por perspectiva BSC
        perspectiva = self.request.query_params.get('perspectiva', None)
        if perspectiva:
            queryset = queryset.filter(
                objetivos_estrategicos__bsc_perspective=perspectiva
            ).distinct()

        # Filtro por estrategia TOWS
        estrategia_id = self.request.query_params.get('estrategia_id', None)
        if estrategia_id:
            queryset = queryset.filter(estrategia_origen_id=estrategia_id)

        # Filtro: proyectos SIN objetivo (GAP analysis)
        sin_objetivo = self.request.query_params.get('sin_objetivo', None)
        if sin_objetivo == 'true':
            queryset = queryset.annotate(
                num_objetivos=Count('objetivos_estrategicos')
            ).filter(num_objetivos=0)

        return queryset

    @action(detail=False, methods=['post'])
    def crear_desde_estrategia(self, request):
        """
        Endpoint: /api/proyectos/crear_desde_estrategia/

        Crea un proyecto a partir de una estrategia TOWS.

        Request Body:
        {
            "estrategia_id": 123,
            "tipo": "normativo",
            "sponsor_id": 5,
            "gerente_id": 8
        }
        """
        from apps.gestion_estrategica.planeacion.contexto.models import EstrategiaTOWS

        estrategia_id = request.data.get('estrategia_id')
        if not estrategia_id:
            return Response(
                {'error': 'estrategia_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            estrategia = EstrategiaTOWS.objects.get(id=estrategia_id)
        except EstrategiaTOWS.DoesNotExist:
            return Response(
                {'error': 'Estrategia no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generar código de proyecto
        empresa = estrategia.empresa
        ultimo_codigo = Proyecto.objects.filter(
            empresa=empresa
        ).order_by('-codigo').first()

        if ultimo_codigo:
            numero = int(ultimo_codigo.codigo.split('-')[-1]) + 1
        else:
            numero = 1

        nuevo_codigo = f"PROY-{numero:04d}"

        # Crear proyecto
        proyecto = Proyecto.objects.create(
            empresa=empresa,
            codigo=nuevo_codigo,
            nombre=f"Proyecto: {estrategia.descripcion[:100]}",
            descripcion=estrategia.descripcion,
            tipo=request.data.get('tipo', Proyecto.TipoProyecto.MEJORA),
            estado=Proyecto.Estado.PROPUESTO,
            prioridad=estrategia.prioridad.lower() if estrategia.prioridad else 'media',
            estrategia_origen=estrategia,
            justificacion=estrategia.objetivo,
            sponsor_id=request.data.get('sponsor_id'),
            gerente_proyecto_id=request.data.get('gerente_id')
        )

        # Vincular objetivo estratégico (si la estrategia lo tiene)
        if estrategia.objetivo_estrategico:
            proyecto.objetivos_estrategicos.add(estrategia.objetivo_estrategico)

        serializer = self.get_serializer(proyecto)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def gap_analysis(self, request):
        """
        Endpoint: /api/proyectos/gap_analysis/

        Retorna objetivos estratégicos sin proyectos asociados.
        """
        from apps.gestion_estrategica.planeacion.models import StrategicObjective

        objetivos_sin_proyectos = StrategicObjective.objects.filter(
            is_active=True
        ).annotate(
            num_proyectos=Count('proyectos_asociados')
        ).filter(num_proyectos=0).values(
            'id', 'code', 'name', 'bsc_perspective', 'status', 'progress'
        )

        return Response(list(objetivos_sin_proyectos))
```

---

## 6. FASE 5: TESTING (Día 11-12)

### 6.1 Tests Unitarios

```python
# backend/apps/gestion_estrategica/gestion_proyectos/tests/test_strategic_links.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.gestion_estrategica.gestion_proyectos.models import Portafolio, Proyecto
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective
from apps.gestion_estrategica.configuracion.models import EmpresaConfig

User = get_user_model()


class PortafolioStrategicLinksTestCase(TestCase):
    """Tests para vinculación de Portafolios con Objetivos Estratégicos"""

    def setUp(self):
        """Configuración inicial"""
        self.empresa = EmpresaConfig.objects.create(
            nombre='Test Company',
            tipo_empresa='CONSULTORIA'
        )

        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

        # Crear plan estratégico
        self.plan = StrategicPlan.objects.create(
            name='Plan 2024-2026',
            period_type='TRIANUAL',
            start_date='2024-01-01',
            end_date='2026-12-31',
            status='VIGENTE',
            is_active=True
        )

        # Crear objetivos estratégicos
        self.objetivo1 = StrategicObjective.objects.create(
            plan=self.plan,
            code='OE-001',
            name='Incrementar rentabilidad',
            bsc_perspective='FINANCIERA',
            is_active=True
        )

        self.objetivo2 = StrategicObjective.objects.create(
            plan=self.plan,
            code='OE-002',
            name='Mejorar satisfacción de clientes',
            bsc_perspective='CLIENTES',
            is_active=True
        )

        # Crear portafolio
        self.portafolio = Portafolio.objects.create(
            empresa=self.empresa,
            codigo='PORT-001',
            nombre='Portafolio de Transformación Digital',
            is_active=True
        )

    def test_vincular_objetivos_a_portafolio(self):
        """Test: Vincular objetivos estratégicos a portafolio"""
        # Vincular objetivos
        self.portafolio.objetivos_estrategicos.set([self.objetivo1, self.objetivo2])

        # Verificar vinculación
        self.assertEqual(self.portafolio.objetivos_estrategicos.count(), 2)
        self.assertIn(self.objetivo1, self.portafolio.objetivos_estrategicos.all())
        self.assertIn(self.objetivo2, self.portafolio.objetivos_estrategicos.all())

    def test_query_inversa_objetivo_a_portafolio(self):
        """Test: Query inversa de objetivo a portafolios"""
        self.portafolio.objetivos_estrategicos.add(self.objetivo1)

        # Query inversa
        portafolios = self.objetivo1.portafolios.all()
        self.assertEqual(portafolios.count(), 1)
        self.assertEqual(portafolios.first(), self.portafolio)

    def test_filtrar_portafolios_por_perspectiva_bsc(self):
        """Test: Filtrar portafolios por perspectiva BSC"""
        self.portafolio.objetivos_estrategicos.add(self.objetivo1)  # FINANCIERA

        portafolios_financieros = Portafolio.objects.filter(
            objetivos_estrategicos__bsc_perspective='FINANCIERA'
        ).distinct()

        self.assertEqual(portafolios_financieros.count(), 1)
        self.assertEqual(portafolios_financieros.first(), self.portafolio)

    def test_property_num_objetivos(self):
        """Test: Property num_objetivos"""
        self.portafolio.objetivos_estrategicos.set([self.objetivo1, self.objetivo2])

        self.assertEqual(self.portafolio.num_objetivos, 2)

    def test_property_perspectivas_bsc(self):
        """Test: Property perspectivas_bsc"""
        self.portafolio.objetivos_estrategicos.set([self.objetivo1, self.objetivo2])

        perspectivas = self.portafolio.perspectivas_bsc
        self.assertIn('FINANCIERA', perspectivas)
        self.assertIn('CLIENTES', perspectivas)


class ProyectoStrategicLinksTestCase(TestCase):
    """Tests para vinculación de Proyectos con Objetivos y Estrategias"""

    def setUp(self):
        """Configuración inicial"""
        self.empresa = EmpresaConfig.objects.create(
            nombre='Test Company',
            tipo_empresa='CONSULTORIA'
        )

        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

        # Crear plan y objetivo
        self.plan = StrategicPlan.objects.create(
            name='Plan 2024-2026',
            period_type='TRIANUAL',
            start_date='2024-01-01',
            end_date='2026-12-31',
            is_active=True
        )

        self.objetivo = StrategicObjective.objects.create(
            plan=self.plan,
            code='OE-001',
            name='Incrementar rentabilidad',
            bsc_perspective='FINANCIERA',
            is_active=True
        )

        # Crear proyecto
        self.proyecto = Proyecto.objects.create(
            empresa=self.empresa,
            codigo='PROY-001',
            nombre='Proyecto de Implementación ERP',
            tipo='IMPLEMENTACION',
            estado='PLANIFICACION',
            is_active=True
        )

    def test_vincular_objetivos_a_proyecto(self):
        """Test: Vincular objetivos estratégicos a proyecto"""
        self.proyecto.objetivos_estrategicos.add(self.objetivo)

        self.assertEqual(self.proyecto.objetivos_estrategicos.count(), 1)
        self.assertIn(self.objetivo, self.proyecto.objetivos_estrategicos.all())

    def test_query_inversa_objetivo_a_proyectos(self):
        """Test: Query inversa de objetivo a proyectos"""
        self.proyecto.objetivos_estrategicos.add(self.objetivo)

        proyectos = self.objetivo.proyectos_asociados.all()
        self.assertEqual(proyectos.count(), 1)
        self.assertEqual(proyectos.first(), self.proyecto)

    def test_property_perspectivas_bsc_cubiertas(self):
        """Test: Property perspectivas_bsc_cubiertas"""
        self.proyecto.objetivos_estrategicos.add(self.objetivo)

        perspectivas = self.proyecto.perspectivas_bsc_cubiertas
        self.assertIn('FINANCIERA', perspectivas)

    def test_gap_analysis_proyectos_sin_objetivo(self):
        """Test: Identificar proyectos sin objetivo estratégico"""
        from django.db.models import Count

        # Crear proyecto sin objetivo
        proyecto_sin_objetivo = Proyecto.objects.create(
            empresa=self.empresa,
            codigo='PROY-002',
            nombre='Proyecto sin objetivo',
            is_active=True
        )

        proyectos_sin_objetivo = Proyecto.objects.annotate(
            num_objetivos=Count('objetivos_estrategicos')
        ).filter(num_objetivos=0)

        self.assertEqual(proyectos_sin_objetivo.count(), 2)  # proyecto + proyecto_sin_objetivo
        self.assertIn(proyecto_sin_objetivo, proyectos_sin_objetivo)
```

### 6.2 Tests de Integración

```python
# backend/apps/gestion_estrategica/gestion_proyectos/tests/test_api_endpoints.py

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.gestion_estrategica.gestion_proyectos.models import Portafolio, Proyecto
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective

User = get_user_model()


class PortafolioAPITestCase(APITestCase):
    """Tests para API de Portafolios"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Crear datos de prueba
        # ... (similar a tests unitarios)

    def test_crear_portafolio_con_objetivos(self):
        """Test: POST /api/portafolios/ con objetivos"""
        url = reverse('portafolio-list')
        data = {
            'codigo': 'PORT-002',
            'nombre': 'Nuevo Portafolio',
            'objetivos_estrategicos': [self.objetivo1.id, self.objetivo2.id]
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['num_objetivos'], 2)

    def test_filtrar_portafolios_por_perspectiva(self):
        """Test: GET /api/portafolios/?perspectiva=FINANCIERA"""
        self.portafolio.objetivos_estrategicos.add(self.objetivo1)

        url = f"{reverse('portafolio-list')}?perspectiva=FINANCIERA"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_endpoint_cobertura_estrategica(self):
        """Test: GET /api/portafolios/cobertura_estrategica/"""
        url = reverse('portafolio-cobertura-estrategica')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class ProyectoAPITestCase(APITestCase):
    """Tests para API de Proyectos"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Crear datos de prueba
        # ... (similar a tests unitarios)

    def test_crear_proyecto_con_objetivos(self):
        """Test: POST /api/proyectos/ con objetivos"""
        url = reverse('proyecto-list')
        data = {
            'codigo': 'PROY-002',
            'nombre': 'Nuevo Proyecto',
            'tipo': 'MEJORA',
            'objetivos_estrategicos': [self.objetivo.id]
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['objetivos_estrategicos_detail']), 1)

    def test_endpoint_gap_analysis(self):
        """Test: GET /api/proyectos/gap_analysis/"""
        url = reverse('proyecto-gap-analysis')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Debería retornar objetivos sin proyectos
        self.assertIsInstance(response.data, list)

    def test_endpoint_crear_desde_estrategia(self):
        """Test: POST /api/proyectos/crear_desde_estrategia/"""
        # Crear estrategia TOWS
        # ... (requiere setup de EstrategiaTOWS)

        url = reverse('proyecto-crear-desde-estrategia')
        data = {
            'estrategia_id': self.estrategia.id,
            'tipo': 'normativo',
            'sponsor_id': self.user.id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estrategia_origen'], self.estrategia.id)
```

**Ejecutar tests**:
```bash
cd c:\Proyectos\StrateKaz
python backend/manage.py test apps.gestion_estrategica.gestion_proyectos.tests
```

---

## 7. FASE 6: FRONTEND (Día 13-20)

### 7.1 Componente: Selector de Objetivos Estratégicos

```typescript
// frontend/src/features/gestion-estrategica/components/ObjetivosSelector.tsx

import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { StrategicObjective } from '@/types/strategic.types';

interface ObjetivosSelectorProps {
  value: number[];  // IDs de objetivos seleccionados
  onChange: (selectedIds: number[]) => void;
  perspectiva?: string;  // Filtro opcional por perspectiva BSC
  multiple?: boolean;  // Permitir selección múltiple
}

export const ObjetivosSelector: React.FC<ObjetivosSelectorProps> = ({
  value = [],
  onChange,
  perspectiva,
  multiple = true
}) => {
  const [objetivos, setObjetivos] = useState<StrategicObjective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjetivos = async () => {
      try {
        const params = perspectiva ? { perspectiva } : {};
        const response = await api.get('/api/planeacion/objectives/', { params });
        setObjetivos(response.data);
      } catch (error) {
        console.error('Error fetching objectives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjetivos();
  }, [perspectiva]);

  const handleSelect = (objetivoId: number) => {
    if (multiple) {
      if (value.includes(objetivoId)) {
        onChange(value.filter(id => id !== objetivoId));
      } else {
        onChange([...value, objetivoId]);
      }
    } else {
      onChange([objetivoId]);
    }
  };

  if (loading) {
    return <div>Cargando objetivos...</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Objetivos Estratégicos
      </label>

      <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
        {objetivos.map((objetivo) => (
          <div
            key={objetivo.id}
            className={`
              p-3 border rounded cursor-pointer transition-colors
              ${value.includes(objetivo.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}
            `}
            onClick={() => handleSelect(objetivo.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    checked={value.includes(objetivo.id)}
                    onChange={() => handleSelect(objetivo.id)}
                    className="mr-2"
                  />
                  <span className="font-semibold text-sm">{objetivo.code}</span>
                  <span className="text-xs text-gray-500">
                    {objetivo.bsc_perspective}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{objetivo.name}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{objetivo.status}</div>
                <div className="text-sm font-medium">{objetivo.progress}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {value.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {value.length} objetivo{value.length > 1 ? 's' : ''} seleccionado{value.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
```

### 7.2 Modal: Crear Proyecto desde Estrategia

```typescript
// frontend/src/features/gestion-estrategica/components/modals/ConvertirEstrategiaModal.tsx

import React, { useState } from 'react';
import { Modal, Button, Form, Select, Input } from '@/components';
import { EstrategiaTOWS } from '@/types/contexto.types';
import { api } from '@/api/client';
import { toast } from '@/hooks/useToast';

interface ConvertirEstrategiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  estrategia: EstrategiaTOWS;
  onSuccess?: () => void;
}

export const ConvertirEstrategiaModal: React.FC<ConvertirEstrategiaModalProps> = ({
  isOpen,
  onClose,
  estrategia,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'normativo' as const,
    sponsor_id: null,
    gerente_id: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/proyectos/crear_desde_estrategia/', {
        estrategia_id: estrategia.id,
        ...formData
      });

      toast.success('Proyecto creado exitosamente');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convertir Estrategia en Proyecto"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Información de la Estrategia */}
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h4 className="font-medium text-sm text-blue-900 mb-2">
            {estrategia.get_tipo_display}
          </h4>
          <p className="text-sm text-gray-700">{estrategia.descripcion}</p>
          {estrategia.objetivo_estrategico && (
            <div className="mt-2 text-xs text-gray-600">
              <strong>Objetivo:</strong> {estrategia.objetivo_estrategico.name}
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <Select
            label="Tipo de Proyecto"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            required
          >
            <option value="mejora">Mejora Continua</option>
            <option value="implementacion">Implementación</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="normativo">Cumplimiento Normativo</option>
            <option value="otro">Otro</option>
          </Select>

          {/* UserSelector para Sponsor y Gerente */}
          {/* ... componentes de selección de usuarios ... */}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear Proyecto
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

---

## 8. CHECKLIST FINAL DE MIGRACIÓN

### Pre-Migración
- [ ] Backup completo de base de datos
- [ ] Ejecutar script de análisis de datos
- [ ] Validar disponibilidad de objetivos estratégicos
- [ ] Comunicar a usuarios sobre la migración

### Ejecución
- [ ] Ejecutar migración 0002 (agregar campos a Portafolio)
- [ ] Ejecutar migración 0003 (agregar campos a Proyecto)
- [ ] Ejecutar migración 0004 (vincular Riesgos y Partes Interesadas)
- [ ] Ejecutar migración 0005 (migrar datos de Portafolio)
- [ ] Ejecutar script de validación
- [ ] Revisar logs de migración fallida

### Post-Migración
- [ ] Ejecutar tests unitarios (100% pass)
- [ ] Ejecutar tests de integración (100% pass)
- [ ] Actualizar serializers y viewsets
- [ ] Actualizar frontend (formularios, selectores)
- [ ] Crear dashboards de cobertura estratégica
- [ ] Documentar cambios en Wiki/Confluence

### Validación Final
- [ ] Query: Portafolios por perspectiva BSC ✅
- [ ] Query: Proyectos por objetivo estratégico ✅
- [ ] Query: Objetivos sin proyectos (GAP) ✅
- [ ] Query: Presupuesto por objetivo ✅
- [ ] Dashboard: Cobertura estratégica ✅
- [ ] Performance: Queries <200ms ✅

### Capacitación
- [ ] Documentar nuevos flujos de trabajo
- [ ] Capacitar a usuarios clave
- [ ] Publicar guía de usuario
- [ ] Monitorear uso en primeras semanas

---

**FIN DEL PLAN DE MIGRACIÓN**

---

**Próximo Paso**: Ejecutar Fase 1 (Preparación) y generar reporte de análisis.

**Archivos Relacionados**:
- `backend/apps/gestion_estrategica/gestion_proyectos/models.py`
- `backend/scripts/analizar_datos_migracion.py`
- `backend/scripts/validar_migracion.py`
