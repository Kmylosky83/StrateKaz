# 🚀 Instrucciones para Ejecutar Seed en Windows

## Paso 1: Abrir PowerShell o CMD

Presiona `Win + R`, escribe `cmd` o `powershell` y presiona Enter.

## Paso 2: Navegar al directorio del backend

```cmd
cd C:\Proyectos\StrateKaz\backend
```

## Paso 3: Activar el entorno virtual

```cmd
venv\Scripts\activate
```

## Paso 4: Ejecutar el seed

```cmd
python manage.py seed_estructura_final
```

## Resultado Esperado:

```
================================================================================
  SEED ESTRUCTURA FINAL - ERP STRATEKAZ
  14 Módulos | 83 Tabs | Secciones | 6 Niveles
================================================================================
  [OK] [10] Direccion Estrategica (8 tabs)
  [UPD] Planeación Estratégica - Secciones actualizadas
  ...
================================================================================
  ESTRUCTURA FINAL CONFIGURADA
================================================================================
  TOTAL: 14 módulos | 83 tabs | 160+ secciones
  ELIMINADAS: X secciones obsoletas
================================================================================
```

## Verificación:

Después de ejecutar el seed, verifica que las secciones estén en el orden correcto:

1. Abre tu navegador en `http://localhost:3010` (o el puerto que uses)
2. Inicia sesión
3. Ve al módulo **Direccion Estrategica**
4. Abre el tab **Planeación Estratégica**
5. Verifica que las secciones aparezcan en este orden:

```
1. Stakeholders
2. Encuestas DOFA
3. DOFA
4. PESTEL
5. Porter
6. TOWS
7. Objetivos BSC
8. Mapa Estratégico
9. KPIs
10. Gestión del Cambio
```

## Troubleshooting:

### Error: "python: command not found"

Prueba con:
```cmd
py manage.py seed_estructura_final
```

### Error: "No module named 'django'"

Asegúrate de haber activado el entorno virtual correctamente.

### Error de base de datos

Asegúrate de que tu base de datos esté corriendo y las credenciales en `settings.py` sean correctas.

---

**¡Listo!** Una vez ejecutado el seed, el módulo de Planeación Estratégica estará completamente configurado con el orden lógico correcto.
