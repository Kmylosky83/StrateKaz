/**
 * Tab de Pruebas de Acidez - Production Ops Recepción
 * NOTA: Migrado de Supply Chain
 *
 * Contiene tabla + formulario para registro y consulta de pruebas de acidez
 */
import { useState } from 'react';
import { PruebaAcidezTable } from './PruebaAcidezTable';
import { PruebaAcidezForm } from './PruebaAcidezForm';
import { Card } from '@/components/common/Card';
import type { PruebaAcidez } from '../types/prueba-acidez.types';

export default function PruebasAcidezTab() {
  const [showForm, setShowForm] = useState(false);
  const [editPrueba, setEditPrueba] = useState<PruebaAcidez | null>(null);

  const handleNew = () => {
    setEditPrueba(null);
    setShowForm(true);
  };

  const handleEdit = (prueba: PruebaAcidez) => {
    setEditPrueba(prueba);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditPrueba(null);
  };

  if (showForm) {
    return (
      <Card>
        <PruebaAcidezForm
          prueba={editPrueba}
          onSuccess={handleCloseForm}
          onCancel={handleCloseForm}
        />
      </Card>
    );
  }

  return <PruebaAcidezTable onNew={handleNew} onEdit={handleEdit} />;
}
