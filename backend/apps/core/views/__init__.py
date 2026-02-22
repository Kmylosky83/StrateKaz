from .security import (
    ratelimit_error_view,
    csrf_failure_view,
    permission_denied_view,
    bad_request_view,
)

from .core_views import (
    health_check,
    health_check_deep,
    current_user,
    test_celery_task,
    task_status,
    revoke_task,
)

from .auth_views import (
    RateLimitedTokenObtainPairView,
    RateLimitedTokenRefreshView,
)

from .two_factor_views import (
    TwoFactorStatusView,
    TwoFactorSetupView,
    TwoFactorEnableView,
    TwoFactorDisableView,
    TwoFactorVerifyView,
    TwoFactorRegenerateBackupCodesView,
)

from .user_preferences_views import (
    UserPreferencesView,
)

from .setup_password_views import (
    SetupPasswordView,
)

__all__ = [
    # Security views
    'ratelimit_error_view',
    'csrf_failure_view',
    'permission_denied_view',
    'bad_request_view',
    # Core views
    'health_check',
    'health_check_deep',
    'current_user',
    'test_celery_task',
    'task_status',
    'revoke_task',
    # Auth views with rate limiting
    'RateLimitedTokenObtainPairView',
    'RateLimitedTokenRefreshView',
    # Two Factor Authentication views
    'TwoFactorStatusView',
    'TwoFactorSetupView',
    'TwoFactorEnableView',
    'TwoFactorDisableView',
    'TwoFactorVerifyView',
    'TwoFactorRegenerateBackupCodesView',
    # User Preferences view (MS-003)
    'UserPreferencesView',
    # Setup Password view (Talent Hub)
    'SetupPasswordView',
]
