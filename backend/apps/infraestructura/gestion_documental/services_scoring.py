"""
Servicio de scoring heurístico para documentos (Fase 6).
Calcula puntuación de cumplimiento 0-100 basada en completitud.
Sin IA — reglas puras. Preparado para integrar IA en el futuro.
"""

import logging
from django.utils import timezone

logger = logging.getLogger('gestion_documental')


class ScoringService:
    """Calcula score de cumplimiento documental basado en reglas heurísticas."""

    # Reglas de scoring (total: 100 puntos)
    RULES = [
        ('contenido', 20, 'Contenido del documento'),
        ('resumen', 10, 'Resumen ejecutivo'),
        ('palabras_clave', 10, 'Palabras clave/etiquetas'),
        ('archivo_pdf', 15, 'Archivo PDF adjunto'),
        ('estado_publicado', 15, 'Estado publicado'),
        ('elaborado_por', 5, 'Elaborado por (autor)'),
        ('revisado_por', 5, 'Revisado por'),
        ('aprobado_por', 5, 'Aprobado por'),
        ('fecha_vigencia', 5, 'Fecha de vigencia definida'),
        ('firmas_completas', 5, 'Firmas digitales completadas'),
        ('texto_extraido', 5, 'Texto extraído (OCR)'),
    ]

    @classmethod
    def calcular_score(cls, documento) -> dict:
        """
        Calcula score de cumplimiento para un documento.

        Returns:
            {
                'score': int (0-100),
                'detalle': {
                    'regla': {'puntos': int, 'maximo': int, 'cumple': bool, 'descripcion': str}
                }
            }
        """
        detalle = {}
        total = 0

        for regla, maximo, descripcion in cls.RULES:
            cumple = cls._evaluar_regla(regla, documento)
            puntos = maximo if cumple else 0
            total += puntos
            detalle[regla] = {
                'puntos': puntos,
                'maximo': maximo,
                'cumple': cumple,
                'descripcion': descripcion,
            }

        return {'score': total, 'detalle': detalle}

    @classmethod
    def _evaluar_regla(cls, regla: str, documento) -> bool:
        """Evalúa una regla individual contra un documento."""
        if regla == 'contenido':
            return bool(documento.contenido and documento.contenido.strip())
        elif regla == 'resumen':
            return bool(documento.resumen and documento.resumen.strip())
        elif regla == 'palabras_clave':
            return bool(documento.palabras_clave and len(documento.palabras_clave) > 0)
        elif regla == 'archivo_pdf':
            return bool(documento.archivo_pdf)
        elif regla == 'estado_publicado':
            return documento.estado == 'PUBLICADO'
        elif regla == 'elaborado_por':
            return documento.elaborado_por_id is not None
        elif regla == 'revisado_por':
            return documento.revisado_por_id is not None
        elif regla == 'aprobado_por':
            return documento.aprobado_por_id is not None
        elif regla == 'fecha_vigencia':
            return documento.fecha_vigencia is not None
        elif regla == 'firmas_completas':
            firmas = documento.get_firmas_digitales()
            if not firmas.exists():
                return False
            return not firmas.filter(estado='PENDIENTE').exists()
        elif regla == 'texto_extraido':
            return bool(
                documento.texto_extraido and documento.texto_extraido.strip()
            )
        return False

    @classmethod
    def actualizar_score(cls, documento):
        """Calcula y guarda el score en el documento."""
        resultado = cls.calcular_score(documento)
        documento.score_cumplimiento = resultado['score']
        documento.score_detalle = resultado['detalle']
        documento.score_actualizado_at = timezone.now()
        documento.save(update_fields=[
            'score_cumplimiento', 'score_detalle', 'score_actualizado_at'
        ])
        return resultado

    @classmethod
    def obtener_resumen(cls, queryset=None):
        """
        Obtiene resumen de scores para dashboard.
        Returns: {promedio, distribucion, incompletos, total}
        """
        from .models import Documento

        if queryset is None:
            queryset = Documento.objects.all()

        total = queryset.count()
        if total == 0:
            return {
                'promedio': 0,
                'distribucion': {'critico': 0, 'bajo': 0, 'medio': 0, 'alto': 0},
                'incompletos': 0,
                'total': 0,
            }

        from django.db.models import Avg, Count, Q

        stats = queryset.aggregate(
            promedio=Avg('score_cumplimiento'),
            critico=Count('id', filter=Q(score_cumplimiento__lt=25)),
            bajo=Count('id', filter=Q(
                score_cumplimiento__gte=25, score_cumplimiento__lt=50
            )),
            medio=Count('id', filter=Q(
                score_cumplimiento__gte=50, score_cumplimiento__lt=75
            )),
            alto=Count('id', filter=Q(score_cumplimiento__gte=75)),
            incompletos=Count('id', filter=Q(score_cumplimiento__lt=60)),
        )

        return {
            'promedio': round(stats['promedio'] or 0),
            'distribucion': {
                'critico': stats['critico'],
                'bajo': stats['bajo'],
                'medio': stats['medio'],
                'alto': stats['alto'],
            },
            'incompletos': stats['incompletos'],
            'total': total,
        }
