---
name: Comando "actualizar versión" al final del día
description: Al recibir "actualizar versión", revisar commits del día, determinar bump SemVer, actualizar package.json, commit+push
type: feedback
---

Cuando el usuario dice **"actualizar versión"**, ejecutar:

1. `git log --since="today"` para ver todos los commits del día
2. Clasificar cambios: solo fixes → PATCH, feature/módulo → MINOR, breaking → MAJOR (preguntar)
3. Actualizar `version` en `frontend/package.json`
4. Commit con mensaje `chore: bump version to X.Y.Z` + changelog breve
5. Push + comando deploy

**Why:** El usuario quiere control manual del versionamiento pero sin tener que decidir el número. La versión se muestra en el sidebar (`APP_VERSION` desde `package.json` via Vite define).

**How to apply:** Solo al recibir la instrucción explícita, nunca automáticamente. SemVer: PATCH=fixes, MINOR=features/módulos, MAJOR=breaking (requiere aprobación).
