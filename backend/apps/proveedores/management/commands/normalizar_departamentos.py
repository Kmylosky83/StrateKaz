"""
Comando de gestión para normalizar nombres de departamentos
"""
from django.core.management.base import BaseCommand
from apps.proveedores.models import Proveedor


class Command(BaseCommand):
    help = 'Normaliza los nombres de departamentos a formato estándar (capitalización correcta)'

    def handle(self, *args, **options):
        self.stdout.write('Normalizando departamentos...')

        # Mapa de normalización
        normalizaciones = {
            'Norte de Santander': [
                'NORTE_DE_SANTANDER', 'norte_de_santander', 'Norte De Santander',
                'NORTE DE SANTANDER', 'norte de santander'
            ],
            'Cundinamarca': ['CUNDINAMARCA', 'cundinamarca'],
            'Santander': ['SANTANDER', 'santander'],
            'Antioquia': ['ANTIOQUIA', 'antioquia'],
            'Atlántico': ['ATLANTICO', 'atlantico', 'Atlantico', 'ATLÁNTICO', 'atlántico'],
            'Bogotá D.C.': ['BOGOTA', 'bogota', 'Bogota', 'BOGOTA D.C.', 'Bogotá', 'BOGOTÁ'],
            'Valle del Cauca': [
                'VALLE_DEL_CAUCA', 'valle_del_cauca', 'Valle Del Cauca',
                'VALLE DEL CAUCA', 'valle del cauca'
            ],
            'Bolívar': ['BOLIVAR', 'bolivar', 'Bolivar', 'BOLÍVAR'],
            'Magdalena': ['MAGDALENA', 'magdalena'],
            'Cesar': ['CESAR', 'cesar'],
            'La Guajira': ['LA_GUAJIRA', 'la_guajira', 'La Guajira', 'LA GUAJIRA'],
            'Córdoba': ['CORDOBA', 'cordoba', 'Cordoba', 'CÓRDOBA', 'córdoba'],
            'Sucre': ['SUCRE', 'sucre'],
            'Boyacá': ['BOYACA', 'boyaca', 'Boyaca', 'BOYACÁ', 'boyacá'],
            'Tolima': ['TOLIMA', 'tolima'],
            'Huila': ['HUILA', 'huila'],
            'Meta': ['META', 'meta'],
            'Casanare': ['CASANARE', 'casanare'],
            'Arauca': ['ARAUCA', 'arauca'],
            'Vichada': ['VICHADA', 'vichada'],
            'Guainía': ['GUAINIA', 'guainia', 'Guainia', 'GUAINÍA', 'guainía'],
            'Guaviare': ['GUAVIARE', 'guaviare'],
            'Vaupés': ['VAUPES', 'vaupes', 'Vaupes', 'VAUPÉS', 'vaupés'],
            'Amazonas': ['AMAZONAS', 'amazonas'],
            'Putumayo': ['PUTUMAYO', 'putumayo'],
            'Caquetá': ['CAQUETA', 'caqueta', 'Caqueta', 'CAQUETÁ', 'caquetá'],
            'Nariño': ['NARINO', 'narino', 'Narino', 'NARIÑO', 'nariño'],
            'Cauca': ['CAUCA', 'cauca'],
            'Chocó': ['CHOCO', 'choco', 'Choco', 'CHOCÓ', 'chocó'],
            'Risaralda': ['RISARALDA', 'risaralda'],
            'Quindío': ['QUINDIO', 'quindio', 'Quindio', 'QUINDÍO', 'quindío'],
            'Caldas': ['CALDAS', 'caldas'],
        }

        total_actualizados = 0

        for departamento_correcto, variantes in normalizaciones.items():
            for variante in variantes:
                count = Proveedor.objects.filter(departamento=variante).update(
                    departamento=departamento_correcto
                )
                if count > 0:
                    total_actualizados += count
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {count} proveedores actualizados: "{variante}" → "{departamento_correcto}"'
                        )
                    )

        # Mostrar departamentos únicos después de normalización
        departamentos = Proveedor.objects.values_list('departamento', flat=True).distinct().order_by('departamento')

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Total de proveedores actualizados: {total_actualizados}'))
        self.stdout.write('\nDepartamentos únicos en la base de datos:')
        for dept in departamentos:
            if dept:
                self.stdout.write(f'  - {dept}')
        self.stdout.write('='*60)
