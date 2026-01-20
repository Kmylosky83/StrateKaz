"""
Tests para Two Factor Authentication (2FA)

Tests para verificar:
- Configuración de 2FA
- Habilitación de 2FA
- Verificación de códigos TOTP
- Uso de códigos de backup
- Deshabilitación de 2FA
- Login con 2FA
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.core.models import User, TwoFactorAuth
import pyotp


@pytest.fixture
def api_client():
    """Cliente API para tests"""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Usuario de prueba"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    return user


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Cliente autenticado"""
    api_client.force_authenticate(user=test_user)
    return api_client


@pytest.mark.django_db
class TestTwoFactorStatus:
    """Tests para verificar estado de 2FA"""

    def test_status_no_2fa(self, authenticated_client):
        """Test: Usuario sin 2FA configurado"""
        url = reverse('core:2fa-status')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_enabled'] is False
        assert response.data['backup_codes_remaining'] == 0

    def test_status_with_2fa_enabled(self, authenticated_client, test_user):
        """Test: Usuario con 2FA habilitado"""
        # Crear y habilitar 2FA
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()
        two_factor.generate_backup_codes()

        url = reverse('core:2fa-status')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_enabled'] is True
        assert response.data['backup_codes_remaining'] == 10


@pytest.mark.django_db
class TestTwoFactorSetup:
    """Tests para configuración inicial de 2FA"""

    def test_setup_success(self, authenticated_client, test_user):
        """Test: Configuración exitosa de 2FA"""
        url = reverse('core:2fa-setup')
        response = authenticated_client.post(url, {
            'password': 'testpass123'
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'qr_code' in response.data
        assert 'secret_key' in response.data
        assert response.data['qr_code'].startswith('data:image/png;base64')

        # Verificar que se creó la configuración
        two_factor = TwoFactorAuth.objects.get(user=test_user)
        assert two_factor.secret_key != ''
        assert two_factor.is_enabled is False

    def test_setup_wrong_password(self, authenticated_client):
        """Test: Setup con contraseña incorrecta"""
        url = reverse('core:2fa-setup')
        response = authenticated_client.post(url, {
            'password': 'wrongpassword'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_setup_already_enabled(self, authenticated_client, test_user):
        """Test: Intentar setup cuando ya está habilitado"""
        # Habilitar 2FA primero
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()

        url = reverse('core:2fa-setup')
        response = authenticated_client.post(url, {
            'password': 'testpass123'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTwoFactorEnable:
    """Tests para habilitar 2FA"""

    def test_enable_success(self, authenticated_client, test_user):
        """Test: Habilitar 2FA con código válido"""
        # Primero hacer setup
        two_factor = TwoFactorAuth.objects.create(user=test_user)
        secret = two_factor.generate_secret()

        # Generar código TOTP válido
        totp = pyotp.TOTP(secret)
        valid_token = totp.now()

        url = reverse('core:2fa-enable')
        response = authenticated_client.post(url, {
            'token': valid_token
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'codes' in response.data
        assert len(response.data['codes']) == 10

        # Verificar que se habilitó
        two_factor.refresh_from_db()
        assert two_factor.is_enabled is True
        assert two_factor.verified_at is not None

    def test_enable_invalid_token(self, authenticated_client, test_user):
        """Test: Intentar habilitar con código inválido"""
        two_factor = TwoFactorAuth.objects.create(user=test_user)
        two_factor.generate_secret()

        url = reverse('core:2fa-enable')
        response = authenticated_client.post(url, {
            'token': '000000'  # Código inválido
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_enable_without_setup(self, authenticated_client):
        """Test: Intentar habilitar sin hacer setup primero"""
        url = reverse('core:2fa-enable')
        response = authenticated_client.post(url, {
            'token': '123456'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTwoFactorVerify:
    """Tests para verificación de código 2FA durante login"""

    def test_verify_totp_success(self, api_client, test_user):
        """Test: Verificar código TOTP válido"""
        # Configurar 2FA
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        secret = two_factor.generate_secret()

        # Generar código válido
        totp = pyotp.TOTP(secret)
        valid_token = totp.now()

        url = reverse('core:2fa-verify')
        response = api_client.post(url, {
            'username': 'testuser',
            'token': valid_token,
            'use_backup_code': False
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['verified'] is True
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_verify_backup_code_success(self, api_client, test_user):
        """Test: Verificar código de backup válido"""
        # Configurar 2FA con códigos de backup
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()
        backup_codes = two_factor.generate_backup_codes()

        # Usar el primer código de backup
        url = reverse('core:2fa-verify')
        response = api_client.post(url, {
            'username': 'testuser',
            'token': backup_codes[0],
            'use_backup_code': True
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['verified'] is True
        assert response.data['backup_codes_remaining'] == 9

    def test_verify_invalid_token(self, api_client, test_user):
        """Test: Código inválido"""
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()

        url = reverse('core:2fa-verify')
        response = api_client.post(url, {
            'username': 'testuser',
            'token': '000000',
            'use_backup_code': False
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTwoFactorDisable:
    """Tests para deshabilitar 2FA"""

    def test_disable_success(self, authenticated_client, test_user):
        """Test: Deshabilitar 2FA exitosamente"""
        # Habilitar 2FA primero
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()
        two_factor.generate_backup_codes()

        url = reverse('core:2fa-disable')
        response = authenticated_client.post(url, {
            'password': 'testpass123'
        })

        assert response.status_code == status.HTTP_200_OK

        # Verificar que se deshabilitó
        two_factor.refresh_from_db()
        assert two_factor.is_enabled is False
        assert two_factor.secret_key == ''
        assert two_factor.backup_codes == []

    def test_disable_wrong_password(self, authenticated_client, test_user):
        """Test: Intentar deshabilitar con contraseña incorrecta"""
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()

        url = reverse('core:2fa-disable')
        response = authenticated_client.post(url, {
            'password': 'wrongpassword'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTwoFactorRegenerateBackupCodes:
    """Tests para regenerar códigos de backup"""

    def test_regenerate_success(self, authenticated_client, test_user):
        """Test: Regenerar códigos exitosamente"""
        # Habilitar 2FA con códigos
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()
        old_codes = two_factor.generate_backup_codes()

        url = reverse('core:2fa-regenerate-backup-codes')
        response = authenticated_client.post(url, {
            'password': 'testpass123'
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'codes' in response.data
        assert len(response.data['codes']) == 10

        # Verificar que los códigos cambiaron
        new_codes = response.data['codes']
        assert new_codes[0] != old_codes[0]

    def test_regenerate_wrong_password(self, authenticated_client, test_user):
        """Test: Regenerar con contraseña incorrecta"""
        two_factor = TwoFactorAuth.objects.create(
            user=test_user,
            is_enabled=True
        )
        two_factor.generate_secret()

        url = reverse('core:2fa-regenerate-backup-codes')
        response = authenticated_client.post(url, {
            'password': 'wrongpassword'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST
