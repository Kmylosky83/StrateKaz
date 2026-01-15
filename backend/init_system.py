"""
SCRIPT DE INICIALIZACIÓN PARA CPANEL
Ejecutar después de subir los archivos corregidos
"""

from django.contrib.auth import get_user_model
from apps.core.models import SystemModule, ModuleTab, TabSection, BrandingConfig

User = get_user_model()

print("=" * 60)
print("INICIALIZANDO SISTEMA STRATEKAZ")
print("=" * 60)

# 1. Verificar superusuario
print("\n1. Verificando superusuario...")
if not User.objects.filter(is_superuser=True).exists():
    print("   ⚠️  No hay superusuarios. Crear uno manualmente.")
else:
    admin = User.objects.filter(is_superuser=True).first()
    print(f"   ✅ Superusuario encontrado: {admin.username}")

# 2. Verificar/Crear Branding
print("\n2. Verificando Branding...")
if not BrandingConfig.objects.filter(is_active=True).exists():
    BrandingConfig.objects.create(
        company_name="StrateKaz",
        tagline="Sistema de Gestión Integral",
        is_active=True
    )
    print("   ✅ Branding creado")
else:
    print(f"   ✅ Branding activo: {BrandingConfig.objects.filter(is_active=True).first().company_name}")

# 3. Verificar Módulos del Sistema
print("\n3. Verificando Módulos del Sistema...")
module_count = SystemModule.objects.count()
if module_count == 0:
    print("   ⚠️  No hay módulos. Creando módulo básico...")
    
    # Crear módulo de Dirección Estratégica
    modulo = SystemModule.objects.create(
        code='gestion_estrategica',
        name='Dirección Estratégica',
        description='Gestión Estratégica del Sistema',
        category='estrategico',
        icon='Building2',
        color='#3b82f6',
        is_enabled=True,
        is_core=True,
        orden=1
    )
    
    # Crear tab de Dashboard
    tab = ModuleTab.objects.create(
        module=modulo,
        code='dashboard',
        name='Dashboard',
        icon='LayoutDashboard',
        is_enabled=True,
        is_core=True,
        orden=1
    )
    
    # Crear sección de Vista General
    TabSection.objects.create(
        tab=tab,
        code='overview',
        name='Vista General',
        is_enabled=True,
        is_core=True,
        orden=1
    )
    
    print("   ✅ Módulo básico creado")
else:
    print(f"   ✅ {module_count} módulos encontrados")
    enabled = SystemModule.objects.filter(is_enabled=True).count()
    print(f"   ✅ {enabled} módulos habilitados")

print("\n" + "=" * 60)
print("INICIALIZACIÓN COMPLETADA")
print("=" * 60)
print("\nPróximos pasos:")
print("1. Restart de la aplicación Python en cPanel")
print("2. Cerrar sesión y volver a entrar")
print("3. Verificar que el dashboard cargue correctamente")
