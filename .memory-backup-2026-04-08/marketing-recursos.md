---
name: marketing-recursos
description: Arquitectura y patrones de la página /recursos del marketing site — biblioteca gratuita con 9 categorías, redirect a Google Drive, suscripciones newsletter
type: project
---

# Marketing Site — Página /recursos

## Arquitectura (implementada 2026-03-27)

### Flujo completo
```
stratekaz.com/recursos
  → 9 CategoryCard (una por categoría)
  → CategoryModal (clic en tarjeta)
    ├── Nombre + email (opcionales)
    ├── Checkbox: notificarme de nuevos recursos en esta categoría
    └── Botón "Acceder" → fetch(apiUrl) → window.open(data.url)
                                          ↑ abre Drive directamente
```

### Por qué fetch() + window.open() en vez de window.open() directo
El Service Worker de `app.stratekaz.com` (Workbox) intercepta peticiones a ese dominio.
Si el modal hace `window.open('https://app.stratekaz.com/api/...')`, el SW lo intercepta
y falla al manejar el redirect externo a drive.google.com.
**Solución:** fetch() al API → recibe JSON `{url: "https://drive.google.com/..."}` → window.open(driveUrl).
El SW no intercepta navegaciones cross-origin a drive.google.com.

### Backend: función view directa (NO DRF router action)
**IMPORTANTE:** DRF router NO maneja `url_path` con barras internas (`recursos/code/acceder`).
La URL retorna 404 si se registra como `@action(url_path='recursos/(?P<code>...)/acceder')`.
**Solución:** función view standalone registrada directamente en `urlpatterns`:
```python
# urls.py
path('public/recursos/<str:code>/acceder/', recursos_acceder_view, name='recursos-acceder'),
```

### Endpoint
- `GET /api/tenant/public/recursos/<code>/acceder/` — sin auth requerida
- Retorna: `{"url": "https://drive.google.com/drive/folders/..."}` (JSON, NO redirect 302)
- Drive URLs almacenadas en `_RESOURCE_DRIVE_URLS` dict en `backend/apps/tenant/views.py`
- Loguea: `resource_access category=X ip=X`

### Suscripciones newsletter
- Endpoint existente: `POST /api/tenant/public/newsletter/`
- Modelo: `NewsletterSubscriber` (schema public) — campo `categorias: list`
- Admin Django: `app.stratekaz.com/admin/tenant/newslettersubscriber/` (requiere /admin/ proxy en Nginx)
- Cuando se suben recursos nuevos: filtrar suscriptores por categoría y enviar email manual/Celery

## Carpetas Google Drive por categoría
| Código | Nombre | Folder ID |
|--------|--------|-----------|
| digital | Transformación Digital & IA | 1YaZId9e5wWPX1M_-NKNj3e2QKttfo8em |
| sst | Seguridad y Salud en el Trabajo | 1jhvr9ji_kzZEQA_HcP7AhXNuUzyMt2id |
| calidad | Calidad ISO 9001 | 1h_NbirXk8A-5zeWTPPGcbOhvdXczUudH |
| legal | Legal y Cumplimiento | 1OUAJNGf85_ua6RcQuTg9kQaGlbnH7FNo |
| ambiental | Ambiental ISO 14001 | 1IUbyqTZs4no1AI9fBQPegtVssv-twleQ |
| talento | Talento Humano | 1-6ODOZqRcmSoGNa3o4LqgccDdYZ3xXy- |
| estrategia | Planeación Estratégica | 13u8sif429zmGYrC9IX7HDrZeQv9lapBT |
| finanzas | Finanzas y Presupuesto | 1_K0g_c_Uzkpm0E0mStX3ESmC4pfYOycy |
| operaciones | Operaciones y Supply Chain | 10neGKQJjvhoD9OpcsPUzWEdKU2nXaf21 |

Para agregar recursos: subir archivos a la carpeta Drive correspondiente. Sin cambios de código.

## Archivos clave
- `marketing_site/src/pages/ResourcesPage.tsx` — página principal con hero animado + grid
- `marketing_site/src/components/resources/CategoryModal.tsx` — modal de acceso
- `marketing_site/src/data/resources.ts` — 9 categorías con metadata visual (sin recursos individuales)
- `backend/apps/tenant/views.py` → `recursos_acceder_view()` + `_RESOURCE_DRIVE_URLS`
- `backend/apps/tenant/urls.py` → `path('public/recursos/<str:code>/acceder/', ...)`
- `backend/apps/tenant/models_newsletter.py` → `NewsletterSubscriber`

## Design System — Hero /recursos
Usa exactamente el mismo patrón que PricingHeroSection:
- `motion.section` + IntersectionObserver (opacity 0→1)
- Badge: `bg-black-card-soft border border-black-border-soft` (NO bg-brand-500/10)
- Icono badge: `animate={{ rotate: [0, 10, -10, 0] }}` con repeatDelay: 3
- Typing animation: 5 frases rotantes (90ms typing, 45ms delete, 2200ms pausa)
- Categoría rotante con `AnimatePresence mode='wait'` + dots indicadores
- Stats con stagger (delay: 0.6 + index * 0.1)
- Cards: `motion.button` con stagger entrada + `whileHover={{ scale: 1.02 }}`
- Color brand correcto: `text-brand-500` (#ec268f) — NO `text-brand-400`

## GA4 Events
- `resource_category_access` — categoría accedida
  - `category_code`, `category_name`
  - `lead_captured: true/false` (si dejó email)
  - `notify_subscribed: true/false`
