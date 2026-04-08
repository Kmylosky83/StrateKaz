# Snapshot de auto-memory de Claude Code — 2026-04-08

## Qué es esto

Backup bruto del directorio de auto-memory de Claude Code que vive en
`C:\Users\Lenovo\.claude\projects\C--Proyectos-StrateKaz\memory\` en la
máquina local de Camilo. Contiene 45 archivos .md (~475 KB) con conocimiento
operacional, arquitectónico, de negocio y de historia del proyecto que
estaba viviendo SIN VERSIONAR.

## Por qué existe este snapshot

Descubierto en sesión de 2026-04-08 durante el inventario L0. Riesgo de
pérdida total ante fallo de disco, reinstalación de Claude Code, o cambio
de máquina. Backup creado como medida de emergencia. NO es la solución
definitiva.

## Qué NO es este snapshot

- NO es la organización definitiva de la memoria del proyecto
- NO está integrado con `CLAUDE.md` ni con `docs/`
- NO debe ser editado directamente — es un snapshot punto en el tiempo
- Puede contener duplicaciones con archivos ya existentes en `docs/`

## Decisión pendiente

Una sesión arquitectónica futura (ver `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md`,
hallazgo H2) debe decidir:
1. Qué archivos del snapshot se promueven a `docs/` del repo
2. Qué archivos se descartan por estar duplicados o ser efímeros
3. Qué rol tiene el directorio auto-memory de Claude Code de ahora en adelante
4. Cómo se evita que conocimiento crítico vuelva a vivir fuera del repo
5. Cómo se actualiza `CLAUDE.md` para reflejar la nueva organización

## Qué hacer si necesitás algo de acá AHORA

Leelo desde este directorio. NO lo edites — si necesitás trabajar con el
contenido, copialo a otro lugar primero.
