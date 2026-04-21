# Referencia de Iconos Lucide React — Todos los Modulos

**Version Lucide React:** 0.468+ | **Total disponibles:** ~1400+ iconos
**Fuente de verdad:** `seed_estructura_final.py` (iconos se cargan desde seeds)

> **Regla:** NO emojis en UI. Solo Lucide React icons. PascalCase en BD y codigo.

---

## Iconos por Modulo

### C0 — Plataforma
| Elemento | Icono |
|----------|-------|
| Centro de Control (audit_system) | `Bell` |

### C1 — Fundacion
| Tab | Icono |
|-----|-------|
| Modulo fundacion | `Landmark` |
| Configuracion | `Settings` |
| Empresa | `Building2` |
| Sedes | `MapPin` |
| Integraciones | `Plug` |
| Normas ISO | `Award` |
| Modulos | `LayoutGrid` |
| Estructura Org. | `Network` |
| Procesos | `FolderTree` |
| Mapa de Procesos | `Grid3x3` |
| Consecutivos | `Hash` |
| Identidad | `Award` |
| Direccionamiento | `Eye` |
| Valores | `Heart` |
| Politicas | `FileCheck` |

### C2 — Planeacion Estrategica
| Tab | Icono |
|-----|-------|
| Modulo | `Target` |
| Contexto | `Compass` |
| Stakeholders | `Users` |
| Encuestas PCI-POAM | `ClipboardList` |
| DOFA | `Grid3X3` |
| PESTEL | `Globe` |
| Porter | `Layers` |
| TOWS | `Lightbulb` |
| Objetivos BSC | `Target` |
| Mapa Estrategico | `Map` |
| KPIs | `BarChart3` |
| Gestion del Cambio | `RefreshCw` |
| Riesgos y Oport. | `ShieldAlert` |
| Proyectos PMI | `FolderKanban` |
| Portafolio | `Briefcase` |
| Iniciacion | `FileSignature` |
| Planificacion | `CalendarRange` |
| Ejecucion | `Activity` |
| Cierre | `CheckCircle2` |

### C2 — Sistema de Gestion
| Tab | Icono |
|-----|-------|
| Modulo | `FolderCog` |
| Planificacion | `Calendar` |
| Documentos | `FileText` |
| Auditorias | `Search` |
| Acciones correctivas | `TrendingUp` |
| Calidad | `Award` |

### C2 — Motor Cumplimiento
| Tab | Icono |
|-----|-------|
| Modulo | `Scale` |
| Matriz Legal | `BookOpen` |
| Requisitos | `FileCheck` |
| Reglamentos | `Gavel` |

### C2 — Motor Riesgos
| Tab | Icono |
|-----|-------|
| Modulo | `AlertCircle` |
| Riesgos de Proceso | `Building2` |
| IPEVR | `GitBranch` |
| Riesgos SST | `ShieldAlert` |
| Aspectos Ambientales | `Leaf` |
| Riesgos Viales | `Car` |
| Seguridad Informacion | `Lock` |
| SAGRILAFT/PTEE | `ShieldCheck` |

### C2 — Workflows
| Tab | Icono |
|-----|-------|
| Modulo | `GitBranch` |
| Disenador | `PenTool` |
| Ejecucion | `Play` |
| Monitoreo | `Activity` |

### C2 — Gestion HSEQ
| Tab | Icono |
|-----|-------|
| Modulo | `ShieldCheck` |
| Planificacion SGI | `Calendar` |
| Calidad | `Award` |
| Medicina Laboral | `Stethoscope` |
| Seguridad Industrial | `HardHat` |
| Higiene Industrial | `Droplet` |
| Comites | `Users` |
| Accidentalidad | `AlertTriangle` |
| Emergencias | `Siren` |
| Gestion Ambiental | `Leaf` |
| Mejora Continua | `TrendingUp` |

### C2 — Talent Hub
| Tab | Icono |
|-----|-------|
| Modulo | `Users` |
| Estructura Cargos | `Briefcase` |
| Seleccion | `UserSearch` |
| Colaboradores | `Users` |
| Onboarding | `BookOpen` |
| Formacion | `GraduationCap` |
| Desempeno | `Star` |
| Control Tiempo | `Clock` |
| Novedades | `FileText` |
| Proceso Disciplinario | `Gavel` |
| Nomina | `DollarSign` |
| Off-boarding | `LogOut` |

### C2 — Supply Chain, Production, Logistics, Sales, Finance, Accounting
> Iconos definidos en seeds. Consultar `seed_estructura_final.py` para referencia exacta.

---

## Iconos por Categoria (referencia rapida)

### Seguridad y Proteccion
```
ShieldCheck, Shield, ShieldAlert, ShieldX, HardHat, Lock, Key, Eye, EyeOff
```

### Alertas y Emergencias
```
AlertTriangle, AlertCircle, AlertOctagon, Siren, Bell, BellRing, Phone
```

### Salud y Medicina
```
Stethoscope, Heart, HeartPulse, Pill, Cross, Activity, Thermometer
```

### Documentos y Archivos
```
FileText, File, Files, Folder, FolderTree, Archive, FileSearch, FileCheck
```

### Analisis y Metricas
```
TrendingUp, TrendingDown, BarChart, BarChart3, PieChart, Activity, Gauge
```

### Usuarios y Equipos
```
Users, UsersRound, User, UserCheck, UserPlus, UserSearch, GraduationCap
```

### Medio Ambiente
```
Leaf, Trees, Sprout, Recycle, Wind, Droplet, Globe, Sun
```

### Procesos y Flujos
```
RefreshCw, GitBranch, Workflow, Play, Activity, PenTool, FolderKanban
```

---

## Como Cambiar un Icono

### Via seed (recomendado)
Modificar `seed_estructura_final.py` → ejecutar `deploy_seeds_all_tenants --only estructura`

### Via Django Shell (temporal)
```python
from apps.core.models import ModuleTab
tab = ModuleTab.objects.get(code='emergencias', module__code='hseq_management')
tab.icon = 'Ambulance'
tab.save()
```

### Convenciones
- **Formato BD:** PascalCase (`AlertTriangle`, NO `alert-triangle`)
- **Import React:** `import { AlertTriangle } from 'lucide-react'`
- **DynamicIcon:** Componente que resuelve icono desde string BD → componente React
- **Buscar iconos:** https://lucide.dev/icons/
