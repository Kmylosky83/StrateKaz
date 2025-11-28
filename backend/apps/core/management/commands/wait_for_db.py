"""
Django management command para esperar a que la base de datos esté disponible.
Esencial para Docker donde MySQL tarda en iniciar.
"""
import time
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    """Command para esperar a que la base de datos esté disponible"""
    
    help = 'Espera a que la base de datos esté disponible antes de continuar'
    
    def handle(self, *args, **options):
        """Maneja el comando"""
        self.stdout.write('🔍 Esperando a que la base de datos esté disponible...')
        db_conn = None
        retries = 0
        max_retries = 30
        
        while not db_conn and retries < max_retries:
            try:
                db_conn = connections['default']
                # Intentar ejecutar una query simple
                db_conn.cursor()
                self.stdout.write(
                    self.style.SUCCESS('✅ Base de datos disponible!')
                )
                return
                
            except OperationalError as e:
                retries += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'⏳ Base de datos no disponible, esperando 1 segundo... '
                        f'(intento {retries}/{max_retries})'
                    )
                )
                self.stdout.write(f'   Error: {str(e)}')
                time.sleep(1)
        
        # Si llegamos aquí, se acabaron los reintentos
        if retries >= max_retries:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ No se pudo conectar a la base de datos después de {max_retries} intentos'
                )
            )
            raise Exception('Database connection timeout')
