/**
 * Utilidades de impresión ERP
 * 
 * Formato: Hoja carta HORIZONTAL (27.94 × 21.59 cm)
 * El contenido ocupa SOLO la mitad izquierda: 13.97 × 21.59 cm
 * La hoja se corta por la mitad para obtener 2 vales por hoja.
 */

interface ItemMovimiento {
  descripcion: string;
  marca?: string;
  cantidad: number;
  precioUnit: number;
  precioTotal: number;
}
interface DatosMovimiento {
  noVale: string;
  fecha: string;
  destino: string;
  items: ItemMovimiento[];
  observaciones?: string;
  entrego?: string;
  recibio?: string;
  autorizo?: string;
  organizacion?: string;
  proveedor?: string;
}
interface ItemRequisicion {
  descripcion: string;
  cantidad: number;
  precioUnit?: number;
  notas?: string;
}
interface DatosRequisicion {
  folio: string;
  fecha: string;
  solicitante: string;
  destino: string;
  items: ItemRequisicion[];
  observaciones?: string;
  encargadoAlmacen?: string;
  autorizador?: string;
  organizacion?: string;
  almacenApproved?: boolean;
  autorizadorApproved?: boolean;
}
export interface DatosMovimientoActivo {
  noMovimiento: string;
  fecha: string;
  direction: 'IN' | 'OUT';
  activo: string;
  numeroSerie?: string;
  categoria?: string;
  responsable?: string;
  centroCosto?: string;
  ubicacion?: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  observations?: string;
  organizacion?: string;
}

function abrirVentana(html: string) {
  const win = window.open('', '_blank', 'width=1100,height=680');
  if (!win) { alert('Permite ventanas emergentes para imprimir.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

function mxn(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS BASE
   - Página: carta horizontal (27.94 × 21.59 cm)
   - El vale (.vale) ocupa exactamente la mitad izquierda: 13.97 × 21.59 cm
   - La línea punteada central (.corte) indica dónde cortar
   - La segunda mitad queda en blanco (para duplicado o desperdicio)
───────────────────────────────────────────────────────────────────────────── */
const BASE_CSS = `
  @page {
    size: 279.4mm 215.9mm;   /* carta horizontal */
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0; padding: 0;
      width: 279.4mm; height: 215.9mm;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8px;
    color: #000;
    background: #fff;
    width: 279.4mm;
    height: 215.9mm;
    display: flex;
    flex-direction: row;
  }

  /* ── Mitad izquierda: el vale ── */
  .vale {
    width: 139.7mm;
    height: 215.9mm;
    padding: 5mm 6mm;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  /* ── Línea de corte central ── */
  .corte {
    width: 0;
    border-left: 1.5px dashed #bbb;
    height: 215.9mm;
    flex-shrink: 0;
    position: relative;
  }
  .corte::before {
    content: '✂';
    position: absolute;
    top: 50%;
    left: -7px;
    font-size: 12px;
    color: #bbb;
    transform: rotate(-90deg);
  }

  /* ── Mitad derecha: duplicado (espejo) ── */
  .duplicado {
    width: 139.7mm;
    height: 215.9mm;
    padding: 5mm 6mm;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    opacity: 0.55;   /* más tenue para el duplicado */
  }

  /* ════════ Elementos internos del vale ════════ */

  /* Cabecera */
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #000;
    padding-bottom: 3mm;
    margin-bottom: 2mm;
    flex-shrink: 0;
  }
  .hdr-org   { font-size: 12px; font-weight: 900; line-height: 1.1; }
  .hdr-sub   { font-size: 6.5px; color: #555; margin-top: 1px; }
  .hdr-right { text-align: right; }
  .hdr-tipo  {
    font-size: 7px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .6px; border: 1.5px solid #000;
    padding: 1px 5px; display: inline-block; margin-bottom: 2px;
  }
  .hdr-folio-lbl { font-size: 6px; color: #666; }
  .hdr-folio-num { font-size: 17px; font-weight: 900; line-height: 1; }

  /* Banda meta */
  .meta {
    border: 1px solid #000;
    margin-bottom: 2mm;
    flex-shrink: 0;
  }
  .meta-row {
    display: flex;
    border-bottom: 1px solid #000;
  }
  .meta-row:last-child { border-bottom: none; }
  .meta-cell {
    flex: 1;
    display: flex;
    align-items: stretch;
    border-right: 1px solid #000;
    min-height: 11px;
  }
  .meta-cell:last-child { border-right: none; }
  .meta-lbl {
    color: #fff;
    font-size: 5.5px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 3px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .meta-val {
    padding: 1px 3px;
    font-size: 7px;
    font-weight: 600;
    display: flex;
    align-items: center;
    flex: 1;
  }

  /* Tabla de ítems */
  .items-wrap {
    flex: 1;
    border: 1px solid #000;
    margin-bottom: 2mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .items-wrap table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .items-wrap thead tr { background: #000; color: #fff; }
  .items-wrap thead th {
    font-size: 6px;
    text-transform: uppercase;
    letter-spacing: .3px;
    padding: 2px 2px;
    font-weight: 700;
    border-right: 1px solid #444;
  }
  .items-wrap thead th:last-child { border-right: none; }
  .items-wrap tbody tr { border-bottom: 1px solid #ddd; }
  .items-wrap tbody tr:nth-child(even) { background: #f9f9f9; }
  .items-wrap tbody td {
    font-size: 7px;
    padding: 2px 2px;
    border-right: 1px solid #e5e5e5;
    height: 10px;
    vertical-align: middle;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .items-wrap tbody td:last-child { border-right: none; }

  /* Banda TOTAL */
  .total-row {
    background: #000;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 5px;
    margin-bottom: 2mm;
    flex-shrink: 0;
  }
  .total-lbl { font-size: 7.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  .total-val { font-size: 12px; font-weight: 900; }

  /* Firmas */
  .firmas {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .firma-col  { flex: 1; text-align: center; }
  .firma-linea {
    border-bottom: 1px solid #000;
    height: 16px;
    margin-bottom: 1px;
    display: flex; align-items: center; justify-content: center;
  }
  .firma-lbl  { font-size: 6px; font-weight: 700; text-transform: uppercase; line-height: 1.4; }

  /* Pie */
  .pie {
    text-align: center;
    font-size: 6px;
    color: #aaa;
    border-top: 1px solid #eee;
    padding-top: 1mm;
    margin-top: 1mm;
    flex-shrink: 0;
  }

  /* Sello duplicado */
  .sello-dup {
    text-align: center;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #ccc;
    border: 2px solid #ddd;
    padding: 2px 8px;
    display: inline-block;
    margin: auto;
    transform: rotate(-15deg);
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers internos
───────────────────────────────────────────────────────────────────────────── */
function firmasHTML(a: string, b: string, c: string, sA = '', sB = '', sC = '') {
  const col = (lbl: string, sello: string) =>
    `<div class="firma-col">
       <div class="firma-linea">${sello}</div>
       <div class="firma-lbl">${lbl}</div>
     </div>`;
  return `<div class="firmas">${col(a,sA)}${col(b,sB)}${col(c,sC)}</div>`;
}

function blancos(n: number, cols: number) {
  const celdas = Array(cols).fill('<td>&nbsp;</td>').join('');
  return Array(Math.max(0, n)).fill(`<tr>${celdas}</tr>`).join('');
}

/* Envuelve el contenido en la estructura hoja-carta con duplicado */
function pagina(contenidoHTML: string, colorTipo: string, titulo: string) {
  // El duplicado es una copia tenue del mismo contenido
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${titulo}</title>
    <style>${BASE_CSS}</style>
  </head><body>
    <!-- ORIGINAL -->
    <div class="vale">${contenidoHTML}</div>
    <!-- LÍNEA DE CORTE -->
    <div class="corte"></div>
    <!-- DUPLICADO (copia tenue) -->
    <div class="duplicado">${contenidoHTML}</div>
  </body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. SALIDA DE ALMACÉN
═══════════════════════════════════════════════════════════════════════════ */
export function printSalidaAlmacen(datos: DatosMovimiento) {
  const FILAS = 16;
  const total = datos.items.reduce((s, i) => s + i.precioTotal, 0);
  const COLOR = '#1D6B42';

  const rows = datos.items.map(i => `
    <tr>
      <td style="text-align:center;width:9%">${i.cantidad}</td>
      <td style="width:52%">${i.descripcion}${i.marca ? ` <span style="color:#999;font-size:6px">(${i.marca})</span>` : ''}</td>
      <td style="text-align:right;width:19%">${i.precioUnit > 0 ? mxn(i.precioUnit) : ''}</td>
      <td style="text-align:right;width:20%">${i.precioTotal > 0 ? mxn(i.precioTotal) : ''}</td>
    </tr>`).join('');

  const html = `
    <div class="hdr">
      <div>
        <div class="hdr-org" style="color:${COLOR}">${datos.organizacion || 'MILPILLAS'}</div>
        <div class="hdr-sub">ALMACÉN CENTRAL</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-tipo">SALIDA DE ALMACÉN</div>
        <div><span class="hdr-folio-lbl">No. </span>
        <span class="hdr-folio-num" style="color:#dc3545">${datos.noVale}</span></div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-row">
        <div class="meta-cell" style="flex:2">
          <span class="meta-lbl" style="background:${COLOR}">Destino / C. Costo</span>
          <span class="meta-val">${datos.destino}</span>
        </div>
        <div class="meta-cell" style="flex:1">
          <span class="meta-lbl" style="background:${COLOR}">Fecha</span>
          <span class="meta-val">${datos.fecha}</span>
        </div>
      </div>
      ${datos.observaciones ? `
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:#555">Obs.</span>
          <span class="meta-val">${datos.observaciones}</span>
        </div>
      </div>` : ''}
    </div>

    <div class="items-wrap">
      <table>
        <thead><tr>
          <th style="width:9%;text-align:center">Cant.</th>
          <th style="width:52%">Descripción del Producto</th>
          <th style="width:19%;text-align:right">Precio Unit.</th>
          <th style="width:20%;text-align:right">Importe</th>
        </tr></thead>
        <tbody>
          ${rows}
          ${blancos(FILAS - datos.items.length, 4)}
        </tbody>
      </table>
    </div>

    <div class="total-row">
      <span class="total-lbl">Total</span>
      <span class="total-val">${total > 0 ? mxn(total) : ''}</span>
    </div>

    ${firmasHTML('Recibió', 'Autorizó', 'Entregó')}
    <div class="pie">ERP Almacén Central · ${datos.organizacion || 'MILPILLAS'}</div>`;

  abrirVentana(pagina(html, COLOR, `Salida de Almacén — ${datos.noVale}`));
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ENTRADA DE ALMACÉN
═══════════════════════════════════════════════════════════════════════════ */
export function printEntradaAlmacen(datos: DatosMovimiento) {
  const FILAS = 16;
  const total = datos.items.reduce((s, i) => s + i.precioTotal, 0);
  const COLOR = '#0d6efd';

  const rows = datos.items.map(i => `
    <tr>
      <td style="text-align:center;width:9%">${i.cantidad}</td>
      <td style="width:52%">${i.descripcion}${i.marca ? ` <span style="color:#999;font-size:6px">(${i.marca})</span>` : ''}</td>
      <td style="text-align:right;width:19%">${i.precioUnit > 0 ? mxn(i.precioUnit) : ''}</td>
      <td style="text-align:right;width:20%">${i.precioTotal > 0 ? mxn(i.precioTotal) : ''}</td>
    </tr>`).join('');

  const html = `
    <div class="hdr">
      <div>
        <div class="hdr-org" style="color:${COLOR}">${datos.organizacion || 'MILPILLAS'}</div>
        <div class="hdr-sub">ALMACÉN CENTRAL</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-tipo" style="border-color:${COLOR}">ENTRADA DE ALMACÉN</div>
        <div><span class="hdr-folio-lbl">No. </span>
        <span class="hdr-folio-num" style="color:${COLOR}">${datos.noVale}</span></div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-row">
        ${datos.proveedor ? `
        <div class="meta-cell" style="flex:1.5">
          <span class="meta-lbl" style="background:${COLOR}">Proveedor</span>
          <span class="meta-val">${datos.proveedor}</span>
        </div>` : ''}
        <div class="meta-cell" style="flex:2">
          <span class="meta-lbl" style="background:${COLOR}">Origen / C. Costo</span>
          <span class="meta-val">${datos.destino}</span>
        </div>
        <div class="meta-cell" style="flex:1">
          <span class="meta-lbl" style="background:${COLOR}">Fecha</span>
          <span class="meta-val">${datos.fecha}</span>
        </div>
      </div>
      ${datos.observaciones ? `
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:#555">Obs.</span>
          <span class="meta-val">${datos.observaciones}</span>
        </div>
      </div>` : ''}
    </div>

    <div class="items-wrap">
      <table>
        <thead><tr>
          <th style="width:9%;text-align:center">Cant.</th>
          <th style="width:52%">Descripción del Producto</th>
          <th style="width:19%;text-align:right">Precio Unit.</th>
          <th style="width:20%;text-align:right">Importe</th>
        </tr></thead>
        <tbody>
          ${rows}
          ${blancos(FILAS - datos.items.length, 4)}
        </tbody>
      </table>
    </div>

    <div class="total-row" style="background:${COLOR}">
      <span class="total-lbl">Total</span>
      <span class="total-val">${total > 0 ? mxn(total) : ''}</span>
    </div>

    ${firmasHTML('Recibió', 'Autorizó', 'Entregó')}
    <div class="pie">ERP Almacén Central · ${datos.organizacion || 'MILPILLAS'}</div>`;

  abrirVentana(pagina(html, COLOR, `Entrada de Almacén — ${datos.noVale}`));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. TICKET COMPRAS
═══════════════════════════════════════════════════════════════════════════ */
export function printTicketCompras(datos: DatosMovimiento) {
  const FILAS = 16;
  const total = datos.items.reduce((s, i) => s + i.precioTotal, 0);
  const COLOR = '#7B4B27';

  const rows = datos.items.map((i, idx) => `
    <tr>
      <td style="text-align:center;width:7%">${idx + 1}</td>
      <td style="width:49%">${i.descripcion}</td>
      <td style="text-align:center;width:10%">${i.cantidad}</td>
      <td style="text-align:right;width:17%">${mxn(i.precioUnit)}</td>
      <td style="text-align:right;width:17%">${mxn(i.precioTotal)}</td>
    </tr>`).join('');

  const html = `
    <div class="hdr">
      <div>
        <div class="hdr-org" style="color:${COLOR}">${datos.organizacion || 'MILPILLAS'}</div>
        <div class="hdr-sub">COMPRAS / FINANZAS · USO INTERNO</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-tipo" style="border-color:${COLOR}">TICKET DE SALIDA</div>
        <div><span class="hdr-folio-lbl">Vale No. </span>
        <span class="hdr-folio-num" style="color:${COLOR}">${datos.noVale}</span></div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-row">
        <div class="meta-cell" style="flex:2">
          <span class="meta-lbl" style="background:${COLOR}">Destino / C. Costo</span>
          <span class="meta-val">${datos.destino}</span>
        </div>
        <div class="meta-cell" style="flex:1">
          <span class="meta-lbl" style="background:${COLOR}">Fecha</span>
          <span class="meta-val">${datos.fecha}</span>
        </div>
      </div>
      ${datos.observaciones ? `
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:#555">Obs.</span>
          <span class="meta-val">${datos.observaciones}</span>
        </div>
      </div>` : ''}
    </div>

    <div class="items-wrap">
      <table>
        <thead><tr>
          <th style="width:7%;text-align:center">#</th>
          <th style="width:49%">Descripción</th>
          <th style="width:10%;text-align:center">Cant.</th>
          <th style="width:17%;text-align:right">P. Unit.</th>
          <th style="width:17%;text-align:right">Total</th>
        </tr></thead>
        <tbody>
          ${rows}
          ${blancos(FILAS - datos.items.length, 5)}
        </tbody>
      </table>
    </div>

    <div class="total-row" style="background:${COLOR}">
      <span class="total-lbl">Total</span>
      <span class="total-val">${mxn(total)}</span>
    </div>

    
    <div class="pie">ERP Almacén Central · ${datos.organizacion || 'MILPILLAS'}</div>`;

  abrirVentana(pagina(html, COLOR, `Ticket Compras — ${datos.noVale}`));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. REQUISICIÓN
═══════════════════════════════════════════════════════════════════════════ */
export function printRequisicion(datos: DatosRequisicion) {
  const FILAS = 14;
  const COLOR = '#1D6B42';

  const rows = datos.items.map(i => `
    <tr>
      <td style="text-align:center;width:12%">${i.cantidad}</td>
      <td style="width:61%">${i.descripcion}</td>
      <td style="width:27%">${i.notas || ''}</td>
    </tr>`).join('');

  const selAlm = datos.almacenApproved
    ? `<span style="color:#1D6B42;font-size:6.5px;font-weight:900;border:1px solid #1D6B42;padding:1px 2px">✓ AUTORIZADO</span>` : '';
  const selAut = datos.autorizadorApproved
    ? `<span style="color:#1D6B42;font-size:6.5px;font-weight:900;border:1px solid #1D6B42;padding:1px 2px">✓ AUTORIZADO</span>` : '';

  const html = `
    <div class="hdr">
      <div>
        <div class="hdr-org" style="color:${COLOR}">${datos.organizacion || 'MILPILLAS'}</div>
        <div class="hdr-sub">ALMACÉN CENTRAL</div>
        <div style="font-size:6px;color:#444;margin-top:1px;font-weight:600">
          REQUISICIÓN DE MATERIALES, REFACCIONES Y SERVICIOS
        </div>
      </div>
      <div class="hdr-right">
        <div class="hdr-tipo">REQUISICIÓN</div>
        <div><span class="hdr-folio-lbl">Folio No. </span>
        <span class="hdr-folio-num" style="color:#dc3545">${datos.folio}</span></div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-row">
        <div class="meta-cell" style="flex:2">
          <span class="meta-lbl" style="background:${COLOR}">Solicitante</span>
          <span class="meta-val">${datos.solicitante}</span>
        </div>
        <div class="meta-cell" style="flex:1">
          <span class="meta-lbl" style="background:${COLOR}">Fecha</span>
          <span class="meta-val">${datos.fecha}</span>
        </div>
      </div>
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:${COLOR}">Destino / Cargo a</span>
          <span class="meta-val">${datos.destino}</span>
        </div>
      </div>
      ${datos.observaciones ? `
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:#555">Obs.</span>
          <span class="meta-val">${datos.observaciones}</span>
        </div>
      </div>` : ''}
    </div>

    <div class="items-wrap">
      <table>
        <thead><tr>
          <th style="width:12%;text-align:center">Cantidad</th>
          <th style="width:61%">Descripción del Artículo</th>
          <th style="width:27%">Notas / Especificaciones</th>
        </tr></thead>
        <tbody>
          ${rows}
          ${blancos(FILAS - datos.items.length, 3)}
        </tbody>
      </table>
    </div>

    ${firmasHTML(
      `Vo. Bo.<br>Enc. Almacén<br>${datos.encargadoAlmacen || ''}`,
      `Autorizó<br>Mesa Directiva<br>${datos.autorizador || ''}`,
      'Solicitante',
      selAlm, selAut, ''
    )}
    <div class="pie">ERP Almacén Central · ${datos.organizacion || 'MILPILLAS'}</div>`;

  abrirVentana(pagina(html, COLOR, `Requisición — ${datos.folio}`));
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. MOVIMIENTO DE ACTIVO
═══════════════════════════════════════════════════════════════════════════ */
export function printMovimientoActivo(datos: DatosMovimientoActivo) {
  const isIn  = datos.direction === 'IN';
  const COLOR = isIn ? '#0d6efd' : '#dc3545';
  const TIPO  = isIn ? 'ENTRADA DE ACTIVO' : 'SALIDA DE ACTIVO';

  const campos: [string, string|undefined][] = [
    ['Activo',           datos.activo],
    ['No. de Serie',     datos.numeroSerie],
    ['Categoría',        datos.categoria],
    ['Responsable',      datos.responsable],
    ['Centro de Costo',  datos.centroCosto],
    ['Ubicación',        datos.ubicacion],
  ];

  const infoRows = campos.filter(([,v]) => v).map(([l, v]) => `
    <tr>
      <td style="width:35%;font-size:6px;font-weight:700;text-transform:uppercase;
                 color:#555;background:#f5f5f5;padding:2px 3px;
                 border-bottom:1px solid #ddd;border-right:1px solid #ddd">${l}</td>
      <td style="font-size:7.5px;font-weight:600;padding:2px 3px;border-bottom:1px solid #ddd">${v}</td>
    </tr>`).join('');

  const html = `
    <div class="hdr">
      <div>
        <div class="hdr-org" style="color:${COLOR}">${datos.organizacion || 'MILPILLAS'}</div>
        <div class="hdr-sub">CONTROL DE ACTIVOS — ALMACÉN</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-tipo" style="border-color:${COLOR};color:${COLOR}">${TIPO}</div>
        <div><span class="hdr-folio-lbl">No. </span>
        <span class="hdr-folio-num" style="color:${COLOR}">${datos.noMovimiento}</span></div>
        <div style="font-size:6.5px;color:#555">${datos.fecha}</div>
      </div>
    </div>

    <!-- Info del activo como tabla -->
    <div class="meta" style="margin-bottom:2mm">
      <table style="width:100%;border-collapse:collapse">
        <tbody>${infoRows}</tbody>
      </table>
    </div>

    <!-- Banda de stock -->
    <div style="display:flex;align-items:center;justify-content:space-around;
                background:${isIn ? '#eef4ff' : '#fff0f0'};
                border:1.5px solid ${COLOR};border-radius:3px;
                padding:6px 4px;margin-bottom:2mm;flex-shrink:0">
      <div style="text-align:center">
        <div style="font-size:6px;text-transform:uppercase;color:#666;margin-bottom:1px">Stock Anterior</div>
        <div style="font-size:20px;font-weight:900;line-height:1">${datos.stockAnterior}</div>
      </div>
      <div style="font-size:16px;color:${COLOR};opacity:.5">→</div>
      <div style="text-align:center">
        <div style="font-size:6px;text-transform:uppercase;color:#666;margin-bottom:1px">${isIn ? 'Entrada' : 'Salida'}</div>
        <div style="font-size:16px;font-weight:900;color:${COLOR};line-height:1">${isIn ? '+' : '−'}${datos.cantidad}</div>
      </div>
      <div style="font-size:16px;color:${COLOR};opacity:.5">→</div>
      <div style="text-align:center">
        <div style="font-size:6px;text-transform:uppercase;color:#666;margin-bottom:1px">Stock Nuevo</div>
        <div style="font-size:20px;font-weight:900;line-height:1">${datos.stockNuevo}</div>
      </div>
    </div>

    ${datos.observations ? `
    <div class="meta" style="margin-bottom:2mm">
      <div class="meta-row">
        <div class="meta-cell">
          <span class="meta-lbl" style="background:#555">Observaciones</span>
          <span class="meta-val">${datos.observations}</span>
        </div>
      </div>
    </div>` : ''}

    <!-- Espacio elástico -->
    <div style="flex:1"></div>

    <div class="total-row" style="background:${COLOR}">
      <span class="total-lbl">${isIn ? 'Total Entrada' : 'Total Salida'}</span>
      <span class="total-val">${datos.cantidad} unidad${datos.cantidad !== 1 ? 'es' : ''}</span>
    </div>

    ${firmasHTML('Recibió / Autorizó', 'Vo. Bo.', 'Entregó / Registró')}
    <div class="pie">ERP Almacén Central · ${datos.organizacion || 'MILPILLAS'}</div>`;

  abrirVentana(pagina(html, COLOR, `${TIPO} — ${datos.activo}`));
}
