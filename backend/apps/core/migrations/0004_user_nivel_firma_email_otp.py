"""
Migración: 2FA por Nivel de Rol (ISO 27001)

- User: nivel_firma (IntegerField), nivel_firma_manual (BooleanField)
- TwoFactorAuth: secret_key max_length 32→256 (cifrado Fernet)
- EmailOTP: nuevo modelo para OTP por email (NIVEL_3)
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_add_infrastructure_transversal_categories'),
    ]

    operations = [
        # 1. User.nivel_firma
        migrations.AddField(
            model_name='user',
            name='nivel_firma',
            field=models.IntegerField(
                choices=[
                    (1, 'Nivel 1 — Operativo (sin 2FA)'),
                    (2, 'Nivel 2 — Responsable/Auditor (TOTP)'),
                    (3, 'Nivel 3 — Alta Dirección (TOTP + OTP email)'),
                ],
                db_index=True,
                default=1,
                help_text='Determina el nivel de verificación 2FA requerido al firmar documentos',
                verbose_name='Nivel de Firma',
            ),
        ),
        # 2. User.nivel_firma_manual
        migrations.AddField(
            model_name='user',
            name='nivel_firma_manual',
            field=models.BooleanField(
                default=False,
                help_text='Si True, el nivel no se auto-asigna al cambiar de cargo',
                verbose_name='Nivel de firma manual',
            ),
        ),
        # 3. TwoFactorAuth.secret_key → max_length 256 (para Fernet)
        migrations.AlterField(
            model_name='twofactorauth',
            name='secret_key',
            field=models.CharField(
                blank=True,
                help_text='Secret key TOTP cifrado con Fernet',
                max_length=256,
            ),
        ),
        # 4. EmailOTP model
        migrations.CreateModel(
            name='EmailOTP',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('otp_hash', models.CharField(help_text='Hash del código OTP (make_password)', max_length=128, verbose_name='OTP hasheado')),
                ('purpose', models.CharField(choices=[('LOGIN', 'Login 2FA'), ('FIRMA', 'Firma Digital')], max_length=20, verbose_name='Propósito')),
                ('is_used', models.BooleanField(default=False, verbose_name='Usado')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(verbose_name='Expira en')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_otps', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'db_table': 'core_email_otp',
                'verbose_name': 'OTP por Email',
                'verbose_name_plural': 'OTPs por Email',
                'indexes': [
                    models.Index(fields=['user', 'purpose', 'is_used'], name='core_email__user_id_purpose_idx'),
                    models.Index(fields=['expires_at'], name='core_email__expires_idx'),
                ],
            },
        ),
    ]
