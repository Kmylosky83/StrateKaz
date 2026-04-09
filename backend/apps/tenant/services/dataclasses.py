"""
Dataclasses del TenantLifecycleService.

Estructuras inmutables para reportar el estado del invariante
Tenant row ↔ schema físico.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class InvariantStatus:
    """
    Estado del invariante para un schema_name específico.

    Consistente cuando:
    - row + schema + tablas existen (tenant operativo)
    - ninguno existe (tenant no creado)

    Inconsistente cuando:
    - row_orphan: row existe pero schema no
    - schema_orphan: schema existe pero row no
    - empty_schema: ambos existen pero schema tiene 0 tablas
    """

    schema_name: str
    row_exists: bool
    schema_exists: bool
    schema_has_tables: bool

    @property
    def is_consistent(self) -> bool:
        if self.row_exists and self.schema_exists and self.schema_has_tables:
            return True
        if not self.row_exists and not self.schema_exists:
            return True
        return False

    @property
    def inconsistency_type(self) -> str | None:
        if self.is_consistent:
            return None
        if self.row_exists and not self.schema_exists:
            return "row_orphan"
        if not self.row_exists and self.schema_exists:
            return "schema_orphan"
        if self.row_exists and self.schema_exists and not self.schema_has_tables:
            return "empty_schema"
        return "unknown"


@dataclass(frozen=True)
class InvariantReport:
    """
    Reporte global del invariante Tenant row ↔ schema.

    Producido por TenantLifecycleService.list_inconsistencies().
    """

    inconsistencies: list[InvariantStatus]
    total_tenants: int
    total_schemas: int

    @property
    def has_inconsistencies(self) -> bool:
        return len(self.inconsistencies) > 0
