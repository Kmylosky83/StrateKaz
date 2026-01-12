/**
 * Exportador de Excel para la Matriz de Permisos
 */
import { toast } from 'sonner';
import type { SystemModuleTree, CargoResumen } from './types';

interface ModulesTreeData {
  modules: SystemModuleTree[];
}

interface ExportParams {
  modulesTree: ModulesTreeData | undefined;
  cargos: CargoResumen[];
  selectedCargo: CargoResumen | null;
  selectedSections: Set<number>;
}

/**
 * Crea contenido XML para Excel (SpreadsheetML)
 */
const createExcelXML = (data: (string | number)[][], title: string): string => {
  const escapeXml = (str: string | number): string => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const header = data[0];
  const bodyRows = data.slice(1);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(title)}</Title>
    <Author>StrateKaz</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#7C3AED" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Cell">
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
      </Borders>
    </Style>
    <Style ss:ID="CellNumber">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <NumberFormat ss:Format="0"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
      </Borders>
    </Style>
    <Style ss:ID="Footer">
      <Alignment ss:Horizontal="Right"/>
      <Font ss:Italic="1" ss:Color="#9CA3AF" ss:Size="9"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(title.substring(0, 31))}">
    <Table>`;

  // Agregar anchos de columna
  header.forEach(() => {
    xml += `\n      <Column ss:AutoFitWidth="1" ss:Width="120"/>`;
  });

  // Agregar encabezados
  xml += `\n      <Row ss:Height="24">`;
  header.forEach((cell) => {
    xml += `\n        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
  });
  xml += `\n      </Row>`;

  // Agregar filas de datos
  bodyRows.forEach((row) => {
    xml += `\n      <Row>`;
    row.forEach((cell) => {
      const isNumber = typeof cell === 'number';
      const styleId = isNumber ? 'CellNumber' : 'Cell';
      const dataType = isNumber ? 'Number' : 'String';
      xml += `\n        <Cell ss:StyleID="${styleId}"><Data ss:Type="${dataType}">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += `\n      </Row>`;
  });

  // Agregar footer con "Powered by StrateKaz"
  xml += `\n      <Row><Cell/></Row>`;
  xml += `\n      <Row>`;
  xml += `\n        <Cell ss:StyleID="Footer" ss:MergeAcross="${header.length - 1}"><Data ss:Type="String">Powered by StrateKaz - Generado el ${new Date().toLocaleDateString('es-CO')}</Data></Cell>`;
  xml += `\n      </Row>`;

  xml += `\n    </Table>
  </Worksheet>
</Workbook>`;

  return xml;
};

/**
 * Exporta la matriz de permisos a Excel
 */
export const exportMatrizToExcel = ({
  modulesTree,
  cargos,
  selectedCargo,
  selectedSections,
}: ExportParams): void => {
  if (!modulesTree) {
    toast.error('No hay datos para exportar');
    return;
  }

  const rows: (string | number)[][] = [];
  let sheetTitle = '';

  // Si hay cargo seleccionado, exportar sus permisos detallados
  if (selectedCargo) {
    sheetTitle = `Permisos ${selectedCargo.name}`;
    rows.push(['Módulo', 'Tab', 'Sección', 'Tiene Acceso']);

    modulesTree.modules
      .filter((m) => m.is_enabled)
      .forEach((module) => {
        module.tabs
          .filter((t) => t.is_enabled)
          .forEach((tab) => {
            tab.sections
              .filter((s) => s.is_enabled)
              .forEach((section) => {
                const hasAccess = selectedSections.has(section.id);
                rows.push([module.name, tab.name, section.name, hasAccess ? 'Sí' : 'No']);
              });
          });
      });
  } else {
    // Exportar resumen de todos los cargos
    sheetTitle = 'Matriz de Cargos';
    rows.push(['Cargo', 'Área', 'Nivel Jerárquico', 'Usuarios', 'Permisos Asignados']);
    cargos.forEach((cargo) => {
      rows.push([
        cargo.name,
        cargo.area_nombre || '-',
        cargo.nivel_jerarquico,
        cargo.users_count || 0,
        cargo.permissions_count || 0,
      ]);
    });
  }

  const excelContent = createExcelXML(rows, sheetTitle);
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = selectedCargo
    ? `permisos_${selectedCargo.code || selectedCargo.name}_${new Date().toISOString().split('T')[0]}.xls`
    : `matriz_cargos_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Archivo Excel exportado exitosamente');
};
