/**
 * ActionBar — Panel de pendientes del empleado en Mi Portal.
 *
 * Grid de ActionCards con los conteos de:
 * - Documentos por firmar (firma digital workflow)
 * - Lecturas pendientes (aceptación documental)
 * - Encuestas sin responder
 *
 * Al tono "danger" si hay alto volumen (>5), "attention" si hay pendientes,
 * y un único card "success" si todo está al día.
 *
 * Click navega al tab correspondiente en Mi Portal.
 */
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, ClipboardList, Sparkles } from 'lucide-react';
import { ActionCard, type ActionCardTone } from '@/components/common';
import { useMiPortalResumen } from '../api/miPortalApi';

const URGENT_THRESHOLD = 5;

function toneFor(count: number): ActionCardTone {
  if (count === 0) return 'default';
  if (count >= URGENT_THRESHOLD) return 'danger';
  return 'attention';
}

export function ActionBar() {
  const navigate = useNavigate();
  const { resumen, isLoading } = useMiPortalResumen();

  // Loading: skeleton grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard loading icon={PenTool} label="Cargando…" />
        <ActionCard loading icon={BookOpen} label="Cargando…" />
        <ActionCard loading icon={ClipboardList} label="Cargando…" />
      </div>
    );
  }

  // Todo al día: un solo card full-width success
  if (resumen.total === 0) {
    return (
      <ActionCard
        icon={Sparkles}
        label="Estás al día"
        sublabel="No tienes pendientes por ahora. Buen trabajo."
        tone="success"
        emptyState
      />
    );
  }

  // Con pendientes: grid accionable
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <ActionCard
        icon={PenTool}
        count={resumen.firmas}
        label="Por firmar"
        sublabel={
          resumen.firmas === 1 ? 'Documento esperando tu firma' : 'Documentos esperando tu firma'
        }
        tone={toneFor(resumen.firmas)}
        onClick={() => navigate('/mi-portal?tab=firma')}
      />
      <ActionCard
        icon={BookOpen}
        count={resumen.lecturas}
        label="Lecturas pendientes"
        sublabel={
          resumen.lecturas === 1
            ? 'Documento requiere tu lectura'
            : 'Documentos requieren tu lectura'
        }
        tone={toneFor(resumen.lecturas)}
        onClick={() => navigate('/mi-portal?tab=lecturas')}
      />
      <ActionCard
        icon={ClipboardList}
        count={resumen.encuestas}
        label="Encuestas activas"
        sublabel={
          resumen.encuestas === 1
            ? 'Encuesta esperando tu respuesta'
            : 'Encuestas esperando tu respuesta'
        }
        tone={toneFor(resumen.encuestas)}
        onClick={() => navigate('/mi-portal?tab=encuestas')}
      />
    </div>
  );
}
