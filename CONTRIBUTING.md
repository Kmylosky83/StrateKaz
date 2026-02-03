# Contributing to StrateKaz

¡Gracias por tu interés en contribuir! Para mantener la calidad y coherencia del proyecto, por favor sigue estas pautas básicas.

## Flujo de contribución

1. Abre un issue describiendo el bug o la mejora.
2. Crea una rama con el formato: `feat/`, `fix/`, `chore/`, p. ej. `feat/feature-name`.
3. Haz tus cambios en la rama y agrega tests si aplica.
4. Ejecuta linters y tests localmente antes de abrir el PR.
5. Abre un Pull Request detallando los cambios y referencia el issue.

## Convenciones de commits

Usamos convenciones tipo Conventional Commits:

- `feat:` Nueva funcionalidad.
- `fix:` Corrección de bug.
- `chore:` Tareas de mantenimiento.
- `docs:` Cambios en documentación.

Ejemplo: `feat(auth): add jwt refresh endpoint`

## Tests y calidad

- Backend: ejecutar `python -m pytest` en `backend`.
- Frontend: ejecutar `npm test` en `frontend`.
- Corrige fallos de lint (`eslint`, `flake8`) antes de abrir PR.

## Revisión y merge

- Agrupa cambios lógicos en PR pequeños y enfocados.
- Incluye una descripción clara y pasos para reproducir (si aplica).
- Añade tests que cubran el comportamiento nuevo o corregido.

## Código de conducta

Por favor respeta nuestro `CODE_OF_CONDUCT.md` — se aplica a todas las contribuciones.

---

Si tienes alguna duda, contacta a `opensource@stratekaz.com`.
