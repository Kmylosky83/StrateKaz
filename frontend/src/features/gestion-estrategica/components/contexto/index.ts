/**
 * Componentes de Contexto Organizacional
 *
 * Secciones (orden lógico del flujo):
 * 1. Stakeholders: Identificación de partes interesadas (Vista 2B)
 * 2. Encuestas: PCI-POAM — fuente principal de datos para DOFA y PESTEL
 * 3. DOFA: Visor de Matriz 2x2 (solo lectura, alimentada desde Encuestas)
 * 4. PESTEL: Visor de Matriz 3x2 (solo lectura, alimentada desde Encuestas)
 * 5. Porter: Análisis de 5 Fuerzas competitivas
 * 6. TOWS: Estrategias cruzadas (requiere DOFA consolidado)
 *
 * Matrices Interactivas:
 * - DOFAMatrix: Matriz 2x2 con drag & drop para factores DOFA
 * - TOWSMatrix: Matriz 2x2 para estrategias TOWS con workflow
 * - PESTELMatrix: Matriz 3x2 para factores PESTEL
 * - PorterDiagram: Diagrama pentagonal de 5 fuerzas
 */

// Secciones (Wrappers con tabla/lista/visor)
export { StakeholdersSection } from './StakeholdersSection';
export { EncuestasDofaSection } from './EncuestasDofaSection';
export { AnalisisDofaSection } from './AnalisisDofaSection';
export { AnalisisPestelSection } from './AnalisisPestelSection';
export { FuerzasPorterSection } from './FuerzasPorterSection';
export { EstrategiasTowsSection } from './EstrategiasTowsSection';

// Wrappers fusionados (REORG-C: 6→3 secciones)
export { AnalisisContextoSection } from './AnalisisContextoSection';
export { DofaEstrategiasSection } from './DofaEstrategiasSection';

// Matrices Interactivas
export { DOFAMatrix } from './DOFAMatrix';
export { TOWSMatrix } from './TOWSMatrix';
export { PESTELMatrix } from './PESTELMatrix';
export { PorterDiagram } from './PorterDiagram';
export { PorterRadarChart } from './PorterRadarChart';
export { StakeholderMatrix } from './StakeholderMatrix';
