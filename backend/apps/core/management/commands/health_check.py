"""
Management command para verificación del estado del sistema StrateKaz.

Uso:
    python manage.py health_check              # Verificación rápida
    python manage.py health_check --deep       # Verificación profunda (DB, Redis, Celery, disco, SSL)
    python manage.py health_check --json       # Salida en formato JSON
    python manage.py health_check --alert      # Enviar alerta por email si hay problemas
    python manage.py health_check --deep --alert --json
"""

import json
import shutil
import socket
import ssl
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Verificación del estado del sistema StrateKaz (DB, Redis, Celery, disco, SSL, backups)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--deep',
            action='store_true',
            default=False,
            help='Ejecutar verificación profunda (Redis, Celery, SSL, backups, servicios)',
        )
        parser.add_argument(
            '--json',
            action='store_true',
            default=False,
            help='Salida en formato JSON',
        )
        parser.add_argument(
            '--alert',
            action='store_true',
            default=False,
            help='Enviar alerta por email si se detectan problemas',
        )

    def handle(self, *args, **options):
        is_deep = options['deep']
        is_json = options['json']
        send_alert = options['alert']

        now = datetime.now()
        results = {
            'timestamp': now.isoformat(),
            'checks': {},
            'issues': [],
            'overall': 'HEALTHY',
        }

        # ─── Checks básicos (siempre) ───
        self._check_database(results)

        # ─── Checks profundos (--deep) ───
        if is_deep:
            self._check_redis(results)
            self._check_celery(results)
            self._check_disk(results)
            self._check_ssl(results)
            self._check_backups(results)
            self._check_services(results)

        # Determinar estado general
        has_critical = any(
            c.get('level') == 'critical' for c in results['checks'].values()
        )
        has_warning = any(
            c.get('level') == 'warning' for c in results['checks'].values()
        )
        has_error = any(
            c.get('level') == 'error' for c in results['checks'].values()
        )

        if has_critical or has_error:
            results['overall'] = 'CRITICAL'
        elif has_warning:
            results['overall'] = 'WARNING'

        # ─── Salida ───
        if is_json:
            self.stdout.write(json.dumps(results, indent=2, default=str))
        else:
            self._print_formatted(results, now, is_deep)

        # ─── Alerta por email ───
        if send_alert and results['overall'] != 'HEALTHY':
            self._send_alert_email(results, now)

        # Exit code: 0=healthy, 1=warning, 2=critical
        if results['overall'] == 'CRITICAL':
            sys.exit(2)
        elif results['overall'] == 'WARNING':
            sys.exit(1)

    # ═══════════════════════════════════════════════════════════════════════
    # CHECKS
    # ═══════════════════════════════════════════════════════════════════════

    def _check_database(self, results):
        """Verificar conectividad a PostgreSQL y estado de migraciones."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")

                # Contar schemas (tenants)
                cursor.execute(
                    "SELECT COUNT(*) FROM public.tenant_tenant"
                )
                schema_count = cursor.fetchone()[0]

                # Contar migraciones
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                migration_count = cursor.fetchone()[0]

                # Verificar migraciones pendientes
                from django.core.management import call_command
                from io import StringIO

                out = StringIO()
                try:
                    call_command('showmigrations', '--plan', stdout=out)
                    plan_output = out.getvalue()
                    pending = plan_output.count('[ ]')
                except Exception:
                    pending = 0

            detail = f'{schema_count} schemas, {migration_count} migraciones aplicadas'
            if pending > 0:
                detail += f', {pending} pendientes'

            results['checks']['database'] = {
                'status': 'healthy' if pending == 0 else 'warning',
                'level': 'ok' if pending == 0 else 'warning',
                'detail': detail,
                'schemas': schema_count,
                'migrations': migration_count,
                'pending_migrations': pending,
            }
            if pending > 0:
                results['issues'].append(
                    f'Base de datos: {pending} migraciones pendientes'
                )
        except Exception as e:
            results['checks']['database'] = {
                'status': 'error',
                'level': 'critical',
                'detail': str(e),
            }
            results['issues'].append(f'Base de datos: {e}')

    def _check_redis(self, results):
        """Verificar conectividad a Redis y uso de memoria."""
        try:
            from django.core.cache import cache

            # Test set/get
            cache.set('_health_check_cmd_', 'ok', 10)
            val = cache.get('_health_check_cmd_')
            cache.delete('_health_check_cmd_')

            if val != 'ok':
                raise Exception('Cache set/get falló')

            # Obtener info de memoria via redis-py
            try:
                from django_redis import get_redis_connection

                redis_conn = get_redis_connection('default')
                info = redis_conn.info('memory')
                used_mb = info.get('used_memory', 0) / (1024 * 1024)
                detail = f'memoria: {used_mb:.1f} MB'
            except Exception:
                detail = 'conectado'

            results['checks']['redis'] = {
                'status': 'healthy',
                'level': 'ok',
                'detail': detail,
            }
        except Exception as e:
            results['checks']['redis'] = {
                'status': 'error',
                'level': 'critical',
                'detail': str(e),
            }
            results['issues'].append(f'Redis: {e}')

    def _check_celery(self, results):
        """Verificar que hay workers de Celery respondiendo."""
        try:
            from config.celery import app as celery_app

            inspector = celery_app.control.inspect(timeout=5.0)
            ping_result = inspector.ping()

            if ping_result:
                worker_count = len(ping_result)
                results['checks']['celery'] = {
                    'status': 'healthy',
                    'level': 'ok',
                    'detail': f'{worker_count} worker(s) activo(s)',
                    'workers': worker_count,
                }
            else:
                results['checks']['celery'] = {
                    'status': 'error',
                    'level': 'critical',
                    'detail': 'sin workers respondiendo',
                }
                results['issues'].append(
                    'Celery: no hay workers respondiendo'
                )
        except Exception as e:
            results['checks']['celery'] = {
                'status': 'error',
                'level': 'error',
                'detail': str(e),
            }
            results['issues'].append(f'Celery: {e}')

    def _check_disk(self, results):
        """Verificar espacio en disco."""
        try:
            base_path = settings.BASE_DIR
            total, used, free = shutil.disk_usage(base_path)
            used_percent = (used / total) * 100
            free_gb = free / (1024 ** 3)

            if used_percent > 90:
                level = 'critical'
                status = 'critical'
            elif used_percent > 80:
                level = 'warning'
                status = 'warning'
            else:
                level = 'ok'
                status = 'healthy'

            results['checks']['disk'] = {
                'status': status,
                'level': level,
                'detail': f'{used_percent:.0f}% usado, {free_gb:.1f} GB libre',
                'used_percent': round(used_percent, 1),
                'free_gb': round(free_gb, 1),
            }
            if level in ('warning', 'critical'):
                results['issues'].append(
                    f'Disco: {used_percent:.0f}% usado ({free_gb:.1f} GB libre)'
                )
        except Exception as e:
            results['checks']['disk'] = {
                'status': 'error',
                'level': 'error',
                'detail': str(e),
            }
            results['issues'].append(f'Disco: {e}')

    def _check_ssl(self, results):
        """Verificar fecha de expiración del certificado SSL."""
        domain = getattr(settings, 'HEALTH_CHECK_SSL_DOMAIN', 'app.stratekaz.com')
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    not_after = datetime.strptime(
                        cert['notAfter'], '%b %d %H:%M:%S %Y %Z'
                    )
                    days_left = (not_after - datetime.utcnow()).days

            if days_left < 7:
                level = 'critical'
                status = 'critical'
            elif days_left < 30:
                level = 'warning'
                status = 'warning'
            else:
                level = 'ok'
                status = 'healthy'

            results['checks']['ssl'] = {
                'status': status,
                'level': level,
                'detail': f'expira en {days_left} días ({not_after.strftime("%Y-%m-%d")})',
                'days_left': days_left,
                'expires': not_after.isoformat(),
                'domain': domain,
            }
            if level in ('warning', 'critical'):
                results['issues'].append(
                    f'SSL: expira en {days_left} días'
                )
        except Exception as e:
            # En desarrollo local, SSL no está disponible — no marcar como crítico
            is_dev = getattr(settings, 'DEBUG', False)
            results['checks']['ssl'] = {
                'status': 'skipped' if is_dev else 'error',
                'level': 'ok' if is_dev else 'warning',
                'detail': f'no disponible ({domain}): {e}' if is_dev else str(e),
            }
            if not is_dev:
                results['issues'].append(f'SSL: {e}')

    def _check_backups(self, results):
        """Verificar edad del último backup."""
        backup_dir = Path(
            getattr(settings, 'HEALTH_CHECK_BACKUP_DIR', '/var/backups/stratekaz/')
        )

        try:
            if not backup_dir.exists():
                is_dev = getattr(settings, 'DEBUG', False)
                results['checks']['backups'] = {
                    'status': 'skipped' if is_dev else 'warning',
                    'level': 'ok' if is_dev else 'warning',
                    'detail': f'directorio no encontrado: {backup_dir}',
                }
                if not is_dev:
                    results['issues'].append(
                        f'Backups: directorio {backup_dir} no encontrado'
                    )
                return

            # Buscar archivos de backup (.sql, .sql.gz, .dump, .tar.gz)
            backup_files = []
            for pattern in ('*.sql', '*.sql.gz', '*.dump', '*.tar.gz', '*.backup'):
                backup_files.extend(backup_dir.glob(pattern))

            if not backup_files:
                results['checks']['backups'] = {
                    'status': 'warning',
                    'level': 'warning',
                    'detail': 'sin archivos de backup encontrados',
                }
                results['issues'].append('Backups: sin archivos encontrados')
                return

            # Encontrar el más reciente
            latest = max(backup_files, key=lambda f: f.stat().st_mtime)
            latest_time = datetime.fromtimestamp(latest.stat().st_mtime)
            age = datetime.now() - latest_time
            age_hours = age.total_seconds() / 3600
            size_mb = latest.stat().st_size / (1024 * 1024)

            if age_hours > 48:
                level = 'critical'
                status = 'critical'
            elif age_hours > 24:
                level = 'warning'
                status = 'warning'
            else:
                level = 'ok'
                status = 'healthy'

            results['checks']['backups'] = {
                'status': status,
                'level': level,
                'detail': f'último: hace {age_hours:.0f}h, {size_mb:.1f} MB',
                'last_backup_age_hours': round(age_hours, 1),
                'last_backup_size_mb': round(size_mb, 1),
                'last_backup_file': latest.name,
            }
            if level in ('warning', 'critical'):
                results['issues'].append(
                    f'Backups: último backup hace {age_hours:.0f} horas'
                )
        except Exception as e:
            results['checks']['backups'] = {
                'status': 'error',
                'level': 'error',
                'detail': str(e),
            }
            results['issues'].append(f'Backups: {e}')

    def _check_services(self, results):
        """Verificar estado de servicios systemd (solo en Linux/prod)."""
        services = [
            'stratekaz-gunicorn',
            'stratekaz-celery',
            'stratekaz-celerybeat',
        ]

        # Solo verificar en Linux con systemd (producción VPS)
        # En Docker o Windows, omitir
        is_docker = Path('/.dockerenv').exists()
        if sys.platform != 'linux' or is_docker:
            env_name = 'Docker' if is_docker else sys.platform
            results['checks']['services'] = {
                'status': 'skipped',
                'level': 'ok',
                'detail': f'no aplica en {env_name}',
            }
            return

        try:
            service_statuses = {}
            all_active = True

            for service in services:
                try:
                    result = subprocess.run(
                        ['systemctl', 'is-active', service],
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    status = result.stdout.strip()
                    service_statuses[service] = status
                    if status != 'active':
                        all_active = False
                except subprocess.TimeoutExpired:
                    service_statuses[service] = 'timeout'
                    all_active = False
                except FileNotFoundError:
                    service_statuses[service] = 'systemctl no disponible'
                    all_active = False

            active_count = sum(
                1 for s in service_statuses.values() if s == 'active'
            )
            total = len(services)

            if all_active:
                level = 'ok'
                status = 'healthy'
            elif active_count > 0:
                level = 'warning'
                status = 'warning'
            else:
                level = 'critical'
                status = 'critical'

            results['checks']['services'] = {
                'status': status,
                'level': level,
                'detail': f'{active_count}/{total} activos',
                'services': service_statuses,
            }
            if not all_active:
                inactive = [
                    k for k, v in service_statuses.items() if v != 'active'
                ]
                results['issues'].append(
                    f'Servicios: {", ".join(inactive)} no activos'
                )
        except Exception as e:
            results['checks']['services'] = {
                'status': 'error',
                'level': 'error',
                'detail': str(e),
            }
            results['issues'].append(f'Servicios: {e}')

    # ═══════════════════════════════════════════════════════════════════════
    # OUTPUT
    # ═══════════════════════════════════════════════════════════════════════

    def _print_formatted(self, results, now, is_deep):
        """Imprimir resultados formateados en consola."""
        title = f'StrateKaz Health Check — {now.strftime("%Y-%m-%d %H:%M:%S")}'
        separator = '=' * 55

        self.stdout.write('')
        self.stdout.write(title)
        self.stdout.write(separator)

        status_icons = {
            'ok': ('OK', self.style.SUCCESS),
            'warning': ('WARN', self.style.WARNING),
            'critical': ('CRIT', self.style.ERROR),
            'error': ('ERR', self.style.ERROR),
        }

        for name, check in results['checks'].items():
            level = check.get('level', 'ok')
            icon_text, style_fn = status_icons.get(
                level, ('??', self.style.NOTICE)
            )
            label = name.capitalize().ljust(18)
            detail = check.get('detail', '')

            status_display = style_fn(f'[{icon_text}]')
            self.stdout.write(f'  {status_display} {label} {detail}')

        self.stdout.write(separator)

        overall = results['overall']
        issue_count = len(results['issues'])

        if overall == 'HEALTHY':
            self.stdout.write(
                self.style.SUCCESS(f'  Estado general: HEALTHY')
            )
        elif overall == 'WARNING':
            self.stdout.write(
                self.style.WARNING(
                    f'  Estado general: WARNING ({issue_count} problema(s))'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'  Estado general: CRITICAL ({issue_count} problema(s))'
                )
            )

        if results['issues']:
            self.stdout.write('')
            self.stdout.write('  Problemas detectados:')
            for issue in results['issues']:
                self.stdout.write(self.style.WARNING(f'    - {issue}'))

        self.stdout.write('')

    # ═══════════════════════════════════════════════════════════════════════
    # EMAIL ALERT
    # ═══════════════════════════════════════════════════════════════════════

    def _send_alert_email(self, results, now):
        """Enviar alerta por email cuando hay problemas."""
        alert_email = getattr(settings, 'ALERT_EMAIL', '')
        if not alert_email:
            self.stderr.write(
                self.style.WARNING(
                    'ALERT_EMAIL no configurado — alerta no enviada'
                )
            )
            return

        # Soportar un solo email o lista separada por comas
        if isinstance(alert_email, str):
            recipients = [e.strip() for e in alert_email.split(',') if e.strip()]
        else:
            recipients = list(alert_email)

        if not recipients:
            self.stderr.write(
                self.style.WARNING(
                    'ALERT_EMAIL vacío — alerta no enviada'
                )
            )
            return

        overall = results['overall']
        subject = f'[StrateKaz] Health Check: {overall}'

        # Construir cuerpo del email
        lines = [
            f'StrateKaz Health Check — {now.strftime("%Y-%m-%d %H:%M:%S")}',
            '=' * 55,
            '',
        ]

        status_icons = {
            'ok': 'OK',
            'warning': 'WARN',
            'critical': 'CRIT',
            'error': 'ERR',
        }

        for name, check in results['checks'].items():
            level = check.get('level', 'ok')
            icon = status_icons.get(level, '??')
            label = name.capitalize().ljust(18)
            detail = check.get('detail', '')
            lines.append(f'  [{icon}] {label} {detail}')

        lines.append('')
        lines.append('=' * 55)
        lines.append(f'Estado general: {overall} ({len(results["issues"])} problema(s))')

        if results['issues']:
            lines.append('')
            lines.append('Problemas detectados:')
            for issue in results['issues']:
                lines.append(f'  - {issue}')

        lines.append('')
        lines.append('---')
        lines.append('Alerta generada automáticamente por StrateKaz SGI.')

        body = '\n'.join(lines)

        try:
            from_email = getattr(
                settings, 'DEFAULT_FROM_EMAIL', 'noreply@stratekaz.com'
            )
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=recipients,
                fail_silently=False,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Alerta enviada a: {", ".join(recipients)}'
                )
            )
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'Error enviando alerta: {e}')
            )
