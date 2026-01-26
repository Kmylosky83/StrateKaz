/**
 * Componentes de Contexto Organizacional
 *
 * Secciones:
 * - Stakeholders: Identificacion de partes interesadas (Vista 2B)
 * - Encuestas DOFA: Recopilacion colaborativa de fortalezas/debilidades
 * - Analisis DOFA: Visualizacion y gestion del analisis DOFA
 * - Analisis PESTEL: Factores externos (Sprint 2)
 * - Fuerzas Porter: Analisis competitivo (Sprint 2)
 * - Estrategias TOWS: Matriz de estrategias cruzadas
 *
 * Matrices Interactivas:
 * - DOFAMatrix: Matriz 2x2 drag & drop para factores DOFA (Sprint 1 Parte 3)
 * - TOWSMatrix: Matriz 2x2 para estrategias TOWS con workflow (Sprint 1 Parte 3)
 * - PESTELMatrix: Matriz 3x2 para factores PESTEL (Sprint 2)
 * - PorterDiagram: Diagrama pentagonal de 5 fuerzas (Sprint 2)
 */

// Secciones (Wrappers con tabla/lista)
export { StakeholdersSection } from './StakeholdersSection';
export { EncuestasDofaSection } from './EncuestasDofaSection';
export { AnalisisDofaSection } from './AnalisisDofaSection';
export { AnalisisPestelSection } from './AnalisisPestelSection';
export { FuerzasPorterSection } from './FuerzasPorterSection';
export { EstrategiasTowsSection } from './EstrategiasTowsSection';

// Matrices Interactivas
export { DOFAMatrix } from './DOFAMatrix';
export { TOWSMatrix } from './TOWSMatrix';
export { PESTELMatrix } from './PESTELMatrix';
export { PorterDiagram } from './PorterDiagram';
export { PorterRadarChart } from './PorterRadarChart';
export { StakeholderMatrix } from './StakeholderMatrix';

// Workflows
export { ContextoWorkflow } from './ContextoWorkflow';
