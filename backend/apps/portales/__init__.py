"""
Capa Portales — Landings por tipo de audiencia.

Esta capa agrupa los portales (UI + API) orientados a distintas audiencias
del tenant. Cada portal es una app independiente que NO modifica datos de
módulos de negocio — solo los consume y presenta.

Portales actuales:
- mi_portal — empleados internos (Colaboradores + Superadmin)

Portales futuros (pendientes de definir patrón de acceso externo H-PORTAL-02):
- portal_proveedores — vendedores externos (acceso via magic link / subdomain)
- portal_clientes    — compradores externos (acceso via magic link / subdomain)
- portal_vacantes    — candidatos en proceso de selección (público/semi-público)

Regla: un portal NUNCA importa de otro portal. Todos consumen de C0/C1/CT/C2
vía endpoints o `apps.get_model()`.
"""
