import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { productsService } from '../../services/productsService';
import { assetsService } from '../../services/assetsService';
import { Product, Asset } from '../../types';
import { FaSearch, FaPrint, FaFileInvoice, FaBox, FaBuilding, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { printSalidaAlmacen, printEntradaAlmacen, printTicketCompras, printMovimientoActivo } from '../../utils/printUtils';

// ─── TAB PRODUCTOS ─────────────────────────────────────────────────────────────
function TabProductos() {
  const [products, setProducts]               = useState<Product[]>([]);
  const [productMovements, setProductMovements] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch]                   = useState('');
  const [dirFilter, setDirFilter]             = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [loading, setLoading]                 = useState(true);
  const [loadingMov, setLoadingMov]           = useState(false);

  useEffect(() => {
    productsService.list()
      .then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSelectProduct = async (p: Product) => {
    setSelectedProduct(p); setLoadingMov(true);
    try { setProductMovements(await productsService.listMovements(p.id)); }
    catch { setProductMovements([]); }
    finally { setLoadingMov(false); }
  };

  const filteredProducts  = products.filter(p => {
    const q = search.toLowerCase();
    return p.marca.toLowerCase().includes(q) ||
      (p.modelo || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q);
  });
  const filteredMovements = productMovements.filter(m =>
    dirFilter === 'ALL' ? true : m.type?.direction === dirFilter
  );

  const buildMovData = (mov: any, product: Product) => {
    const detail = mov.details?.[0] || {};
    return {
      noVale: mov.id.substring(0, 8).toUpperCase(),
      fecha: new Date(mov.createdAt).toLocaleDateString('es-MX'),
      destino: mov.costCenter?.name || mov.observations || '—',
      proveedor: (product as any).proveedor?.nombre || '',
      observaciones: mov.observations || detail.observations || '',
      items: [{
        descripcion: `${product.marca}${product.modelo ? ' ' + product.modelo : ''}${product.sku ? ' (' + product.sku + ')' : ''}`,
        marca: (product as any).proveedor?.nombre || '',
        cantidad: detail.quantity || 1,
        precioUnit: Number(detail.unitPrice || product.precioUnitario || 0),
        precioTotal: Number(detail.quantity || 1) * Number(detail.unitPrice || product.precioUnitario || 0),
      }],
      entrego: mov.responsible?.email || '',
    };
  };

  const handlePrintSalida  = (mov: any) => { if (!selectedProduct) return; printSalidaAlmacen(buildMovData(mov, selectedProduct)); };
  const handlePrintEntrada = (mov: any) => { if (!selectedProduct) return; printEntradaAlmacen(buildMovData(mov, selectedProduct)); };
  const handlePrintTicket  = (mov: any) => { if (!selectedProduct) return; printTicketCompras(buildMovData(mov, selectedProduct)); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 175px)' }}>
      {/* Panel izquierdo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="search-bar" style={{ margin: 0 }}>
          <FaSearch style={{ color: '#aaa', flexShrink: 0 }} />
          <input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div className="loading">Cargando...</div> : (
            <table>
              <thead><tr><th>Producto</th><th>Stock</th></tr></thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} onClick={() => handleSelectProduct(p)}
                    style={{ cursor: 'pointer', background: selectedProduct?.id === p.id ? '#e8f5ee' : undefined }}>
                    <td>
                      <strong style={{ fontSize: 13 }}>{p.marca}</strong>
                      {p.modelo && <span style={{ color: '#888', fontSize: 12 }}> {p.modelo}</span>}
                      {p.sku && <div style={{ fontSize: 11, color: '#aaa' }}>{p.sku}</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.stockActual <= 5 ? 'badge-red' : p.stockActual <= 20 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stockActual}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="table-wrapper" style={{ overflowY: 'auto', overflowX: 'auto' }}>
        {!selectedProduct ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
            <p>Selecciona un producto para ver sus movimientos</p>
          </div>
        ) : loadingMov ? (
          <div className="loading">Cargando movimientos...</div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{selectedProduct.marca} {selectedProduct.modelo}</strong>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  SKU: {selectedProduct.sku || '—'} &nbsp;|&nbsp; Stock:&nbsp;
                  <strong style={{ color: selectedProduct.stockActual <= 5 ? '#dc3545' : '#1D6B42' }}>{selectedProduct.stockActual}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ALL', 'IN', 'OUT'] as const).map(d => (
                  <button key={d} className={`btn btn-sm ${dirFilter === d ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setDirFilter(d)}>
                    {d === 'ALL' ? 'Todos' : d === 'IN' ? '⬆ Entradas' : '⬇ Salidas'}
                  </button>
                ))}
                <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>{filteredMovements.length} mov.</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Tipo</th><th>Dir.</th><th>Cantidad</th>
                    <th>Precio Unit.</th><th>Total</th><th>Centro Costo</th><th>Obs.</th>
                    <th style={{ minWidth: 200 }}>Hojas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin movimientos</td></tr>
                  ) : filteredMovements.map((m: any) => {
                    const detail = m.details?.[0] || m;
                    const isOut  = m.type?.direction === 'OUT';
                    const qty    = detail.quantity ?? 0;
                    const price  = Number(detail.unitPrice || 0);
                    const total  = qty * price;
                    return (
                      <tr key={m.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{new Date(m.createdAt).toLocaleDateString('es-MX')}</td>
                        <td style={{ fontSize: 11 }}>{m.type?.name || '—'}</td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 10 }}>
                            {isOut ? '⬇ Salida' : '⬆ Entrada'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{qty}</td>
                        <td style={{ fontSize: 11 }}>${price.toFixed(2)}</td>
                        <td style={{ fontSize: 11 }}>${total.toFixed(2)}</td>
                        <td style={{ fontSize: 11 }}>{m.costCenter?.name || '—'}</td>
                        <td style={{ fontSize: 11, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.observations || detail.observations || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            {isOut ? (
                              <>
                                <button className="btn btn-sm" title="Imprimir Hoja de Salida"
                                  style={{ background: '#1D6B42', color: 'white', padding: '3px 7px', fontSize: 10 }}
                                  onClick={() => handlePrintSalida(m)}>
                                  <FaPrint style={{ marginRight: 2 }} />Salida
                                </button>
                                <button className="btn btn-sm" title="Ticket Compras"
                                  style={{ background: '#7B4B27', color: 'white', padding: '3px 7px', fontSize: 10 }}
                                  onClick={() => handlePrintTicket(m)}>
                                  <FaFileInvoice style={{ marginRight: 2 }} />Compras
                                </button>
                              </>
                            ) : (
                              <button className="btn btn-sm" title="Imprimir Hoja de Entrada"
                                style={{ background: '#0d6efd', color: 'white', padding: '3px 7px', fontSize: 10 }}
                                onClick={() => handlePrintEntrada(m)}>
                                <FaPrint style={{ marginRight: 2 }} />Entrada
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TAB ACTIVOS ───────────────────────────────────────────────────────────────
function TabActivos() {
  const [assets, setAssets]               = useState<Asset[]>([]);
  const [assetMovements, setAssetMovements] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch]               = useState('');
  const [dirFilter, setDirFilter]         = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [loading, setLoading]             = useState(true);
  const [loadingMov, setLoadingMov]       = useState(false);

  useEffect(() => {
    assetsService.list()
      .then(setAssets).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSelectAsset = async (a: Asset) => {
    setSelectedAsset(a); setLoadingMov(true);
    try { setAssetMovements(await assetsService.listMovements(a.id)); }
    catch { setAssetMovements([]); }
    finally { setLoadingMov(false); }
  };

  const filteredAssets = assets.filter(a => {
    const q = search.toLowerCase();
    return a.marca.toLowerCase().includes(q) ||
      (a.modelo || '').toLowerCase().includes(q) ||
      (a.numeroSerie || '').toLowerCase().includes(q);
  });

  const filteredMovements = assetMovements.filter(m =>
    dirFilter === 'ALL' ? true :
    dirFilter === 'IN'  ? m.action === 'ASSET_MOVEMENT_IN' : m.action === 'ASSET_MOVEMENT_OUT'
  );

  const handlePrint = (m: any) => {
    if (!selectedAsset) return;
    const a = selectedAsset as any;
    const nv: any = m.newValue || {};
    const ov: any = m.oldValue || {};
    const isIn    = m.action === 'ASSET_MOVEMENT_IN';
    printMovimientoActivo({
      noMovimiento:  m.id.substring(0, 8).toUpperCase(),
      fecha:         new Date(m.createdAt).toLocaleDateString('es-MX'),
      direction:     isIn ? 'IN' : 'OUT',
      activo:        `${a.marca}${a.modelo ? ' ' + a.modelo : ''}`,
      numeroSerie:   a.numeroSerie || undefined,
      categoria:     a.category?.name || undefined,
      responsable:   a.responsableNombre || a.responsable?.email || undefined,
      centroCosto:   a.centroCosto || undefined,
      ubicacion:     a.ubicacion || undefined,
      cantidad:      nv.quantity ?? 0,
      stockAnterior: ov.stockActual ?? 0,
      stockNuevo:    nv.stockActual ?? 0,
      observations:  nv.observations || undefined,
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 175px)' }}>
      {/* Panel izquierdo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="search-bar" style={{ margin: 0 }}>
          <FaSearch style={{ color: '#aaa', flexShrink: 0 }} />
          <input placeholder="Buscar activo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div className="loading">Cargando...</div> : (
            <table>
              <thead><tr><th>Activo</th><th>Stock</th></tr></thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={a.id} onClick={() => handleSelectAsset(a)}
                    style={{ cursor: 'pointer', background: selectedAsset?.id === a.id ? '#e8f5ee' : undefined }}>
                    <td>
                      <strong style={{ fontSize: 13 }}>{a.marca}</strong>
                      {a.modelo && <span style={{ color: '#888', fontSize: 12 }}> {a.modelo}</span>}
                      {a.numeroSerie && <div style={{ fontSize: 11, color: '#aaa' }}>S/N: {a.numeroSerie}</div>}
                    </td>
                    <td>
                      <span className={`badge ${(a.stockActual ?? 0) <= 0 ? 'badge-red' : 'badge-blue'}`}>
                        {a.stockActual ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="table-wrapper" style={{ overflowY: 'auto', overflowX: 'auto' }}>
        {!selectedAsset ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
            <p>Selecciona un activo para ver sus movimientos</p>
          </div>
        ) : loadingMov ? (
          <div className="loading">Cargando movimientos...</div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{selectedAsset.marca} {selectedAsset.modelo}</strong>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {selectedAsset.numeroSerie && <>S/N: {selectedAsset.numeroSerie} &nbsp;|&nbsp;</>}
                  Stock: <strong style={{ color: (selectedAsset.stockActual ?? 0) <= 0 ? '#dc3545' : '#1D6B42' }}>
                    {selectedAsset.stockActual ?? 0}
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ALL', 'IN', 'OUT'] as const).map(d => (
                  <button key={d} className={`btn btn-sm ${dirFilter === d ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setDirFilter(d)}>
                    {d === 'ALL' ? 'Todos' : d === 'IN' ? '⬆ Entradas' : '⬇ Salidas'}
                  </button>
                ))}
                <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>{filteredMovements.length} mov.</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Anterior</th>
                    <th>Stock Nuevo</th>
                    <th>Observaciones</th>
                    <th>Hoja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin movimientos</td></tr>
                  ) : filteredMovements.map((m: any) => {
                    const isIn = m.action === 'ASSET_MOVEMENT_IN';
                    const nv: any = m.newValue || {};
                    const ov: any = m.oldValue || {};
                    return (
                      <tr key={m.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{new Date(m.createdAt).toLocaleDateString('es-MX')}</td>
                        <td>
                          <span className={`badge ${isIn ? 'badge-blue' : 'badge-red'}`} style={{ fontSize: 10 }}>
                            {isIn ? <><FaArrowDown style={{ marginRight: 3 }} />Entrada</> : <><FaArrowUp style={{ marginRight: 3 }} />Salida</>}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: isIn ? '#0d6efd' : '#dc3545' }}>
                          {isIn ? '+' : '-'}{nv.quantity ?? '?'}
                        </td>
                        <td style={{ fontSize: 12 }}>{ov.stockActual ?? '—'}</td>
                        <td style={{ fontSize: 12, fontWeight: 700 }}>{nv.stockActual ?? '—'}</td>
                        <td style={{ fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {nv.observations || '—'}
                        </td>
                        <td>
                          <button className="btn btn-sm"
                            style={{ background: isIn ? '#0d6efd' : '#dc3545', color: 'white', padding: '3px 8px', fontSize: 10 }}
                            title={isIn ? 'Imprimir Entrada' : 'Imprimir Salida'}
                            onClick={() => handlePrint(m)}>
                            <FaPrint style={{ marginRight: 3 }} />{isIn ? 'Entrada' : 'Salida'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function Movimientos() {
  const [tab, setTab] = useState<'productos' | 'activos'>('productos');

  const tabStyle = (t: string) => ({
    padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
    fontWeight: tab === t ? 700 : 400, fontSize: 15,
    color: tab === t ? '#1D6B42' : '#888',
    borderBottom: tab === t ? '3px solid #1D6B42' : '3px solid transparent',
    display: 'flex', alignItems: 'center', gap: 8,
  });

  return (
    <Layout>
      {/* Header con tabs */}
      <div style={{ borderBottom: '2px solid #eee', marginBottom: 16, display: 'flex', gap: 4 }}>
        <button style={tabStyle('productos')} onClick={() => setTab('productos')}>
          <FaBox /> Movimientos de Productos
        </button>
        <button style={tabStyle('activos')} onClick={() => setTab('activos')}>
          <FaBuilding /> Movimientos de Activos
        </button>
      </div>

      {tab === 'productos' ? <TabProductos /> : <TabActivos />}
    </Layout>
  );
}
