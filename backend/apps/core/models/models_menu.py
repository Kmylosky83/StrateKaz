"""
Modelo de Menu Dinamico - StrateKaz

MenuItem: Permite configurar el Sidebar dinamicamente
"""
from django.db import models


class MenuItem(models.Model):
    """
    Item de menu del sistema - Permite configurar el Sidebar dinamicamente

    Estructura jerarquica:
    - Categorias (nivel 0): Las 6 categorias del sistema (Estrategico, Motor, Integral, Misional, Apoyo, Inteligencia)
    - Modulos (nivel 1): Proveedores, Planta, SST, etc.
    - Submodulos (nivel 2): EcoNorte, Recepciones, etc.

    El acceso se controla mediante:
    - allowed_cargos: Cargos que pueden ver el item
    - allowed_roles: Roles que pueden ver el item
    - required_permissions: Permisos requeridos para ver el item
    """

    MACROPROCESS_CHOICES = [
        ('DIRECCION_ESTRATEGICA', 'Direccion Estrategica'),
        ('GESTION_MISIONAL', 'Gestion Misional'),
        ('GESTION_APOYO', 'Gestion de Apoyo'),
        ('GESTION_INTEGRAL', 'Gestion Integral'),
    ]

    COLOR_CHOICES = [
        ('purple', 'Purpura'),
        ('blue', 'Azul'),
        ('green', 'Verde'),
        ('orange', 'Naranja'),
        ('red', 'Rojo'),
        ('gray', 'Gris'),
    ]

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Codigo',
        help_text='Codigo unico del item de menu (ej: menu.econorte)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible en el menu'
    )
    path = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ruta',
        help_text='Ruta del frontend (ej: /proveedores/econorte)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Users, Truck, Package)'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Item padre',
        help_text='Item de menu padre (para jerarquia)'
    )
    macroprocess = models.CharField(
        max_length=30,
        choices=MACROPROCESS_CHOICES,
        blank=True,
        null=True,
        db_index=True,
        verbose_name='Categoria',
        help_text='Categoria del sistema a la que pertenece (solo para items de nivel 0 - Legacy: usar SystemModule.category)'
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color del item (solo para items de nivel 0)'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparicion en el menu'
    )
    badge = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Badge',
        help_text='Texto del badge (ej: Nuevo, Beta)'
    )
    allowed_cargos = models.ManyToManyField(
        'core.Cargo',
        blank=True,
        related_name='menu_items',
        verbose_name='Cargos permitidos',
        help_text='Cargos que pueden ver este item'
    )
    allowed_roles = models.ManyToManyField(
        'core.Role',
        blank=True,
        related_name='menu_items',
        verbose_name='Roles permitidos',
        help_text='Roles que pueden ver este item'
    )
    required_permissions = models.ManyToManyField(
        'core.Permiso',
        blank=True,
        related_name='menu_items',
        verbose_name='Permisos requeridos',
        help_text='Permisos necesarios para ver este item'
    )
    is_category = models.BooleanField(
        default=False,
        verbose_name='Es categoria',
        help_text='Si es una categoria (sin ruta)'
    )
    allow_all = models.BooleanField(
        default=False,
        verbose_name='Permitir todos',
        help_text='Si esta activo, todos los usuarios autenticados pueden ver este item'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creacion'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    class Meta:
        db_table = 'core_menu_item'
        verbose_name = 'Item de Menu'
        verbose_name_plural = 'Items de Menu'
        ordering = ['orden', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'orden']),
            models.Index(fields=['parent', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def level(self):
        """Calcula el nivel jerarquico del item"""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    def user_has_access(self, user):
        """
        Verifica si un usuario tiene acceso a este item de menu

        Args:
            user: Usuario a verificar

        Returns:
            bool: True si tiene acceso
        """
        # Superusuario siempre tiene acceso
        if user.is_superuser:
            return True

        # Si permite todos, cualquier usuario autenticado puede ver
        if self.allow_all:
            return True

        # Verificar por cargo
        if user.cargo and self.allowed_cargos.filter(id=user.cargo.id).exists():
            return True

        # Verificar por roles del usuario
        user_role_ids = user.user_roles.filter(
            role__is_active=True
        ).values_list('role_id', flat=True)

        if self.allowed_roles.filter(id__in=user_role_ids).exists():
            return True

        # Verificar por permisos requeridos
        required_perms = self.required_permissions.filter(is_active=True)
        if required_perms.exists():
            user_perms = user.get_all_permissions()
            required_codes = set(required_perms.values_list('code', flat=True))
            user_codes = set(user_perms.values_list('code', flat=True))
            if required_codes.issubset(user_codes):
                return True

        return False

    @classmethod
    def get_user_menu(cls, user):
        """
        Obtiene el menu completo filtrado para un usuario

        Args:
            user: Usuario para filtrar el menu

        Returns:
            list: Lista de items de menu accesibles en estructura jerarquica
        """
        def build_tree(items, parent=None):
            result = []
            for item in items:
                if item.parent == parent and item.user_has_access(user):
                    children = build_tree(items, item)
                    item_data = {
                        'id': item.id,
                        'code': item.code,
                        'name': item.name,
                        'path': item.path,
                        'icon': item.icon,
                        'color': item.color,
                        'badge': item.badge,
                        'is_category': item.is_category,
                        'orden': item.orden,
                        'children': children if children else None
                    }
                    result.append(item_data)
            return sorted(result, key=lambda x: x['orden'])

        all_items = cls.objects.filter(is_active=True).prefetch_related(
            'allowed_cargos', 'allowed_roles', 'required_permissions'
        )
        return build_tree(list(all_items))
