import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { requisitionsService } from '../../services/requisitionsService';
import { productsService } from '../../services/productsService';
import { costCentersService } from '../../services/costCentersService';
import { Requisition } from '../../types';
import { FaSearch, FaPlus, FaEye, FaPrint, FaStamp, FaTimes, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { printRequisicion } from '../../utils/printUtils';

const statusColor = (name?: string) => {
  if (!name) return 'badge-gray';
  const n = name.toLowerCase();
  if (n.includes('pend') || n.includes('revision')) return 'badge-yellow';
  if (n.includes('autori') || n.includes('apro')) return 'badge-green';
  if (n.includes('rechaz') || n.includes('cancel')) return 'badge-red';
  return 'badge-blue';
};

export default function Requisiciones() {
  const { role, currentEnvironment } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [filtered, setFiltered] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Requisition | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [authorizing, setAuthorizing] = useState<Requisition | null>(null);

  const envName = (currentEnvironment?.environment?.name || '').toUpperCase();

  const canCreate    = ['ADMIN', 'ALMACEN', 'USUARIO'].includes(role || '');
  const canAuthorize = ['ADMIN', 'ALMACEN', 'AUTORIZADOR'].includes(role || '');

  const load = async () => {
    try { const d = await requisitionsService.list(); setRequisitions(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(requisitions.filter(r =>
      r.folio.toLowerCase().includes(q) ||
      r.solicitorName.toLowerCase().includes(q) ||
      ((r as any).destination?.name || '').toLowerCase().includes(q)
    ));
  }, [search, requisitions]);

  const handlePrint = (r: Requisition) => {
    const req = r as any;
    printRequisicion({
      folio: r.folio,
      fecha: new Date(r.createdAt).toLocaleDateString('es-MX'),
      solicitante: r.solicitorName,
      destino: req.destination?.name || '—',
      observaciones: r.observations || '',
      organizacion: envName || 'MILPILLAS',
      encargadoAlmacen: req.almacenAuth?.email || '',
      autorizador: req.authorizer?.email || '',
      almacenApproved: req.almacenApproved === true,
      autorizadorApproved: req.autorizadorApproved === true,
      items: (r.details || []).map((d: any) => ({
        descripcion: `${d.product?.marca || ''} ${d.product?.modelo || ''} ${d.product?.sku ? '(' + d.product.sku + ')' : ''}`.trim(),
        cantidad: d.quantity,
        notas: d.notes || '',
      })),
    });
  };

  return (
    <Layout>
      {/* Indicador de entorno */}
      {envName && (
        <div style={{ marginBottom: 8, fontSize: 12, color: '#7B4B27', fontWeight: 700 }}>
          📦 Entorno: {envName}
        </div>
      )}

      <div className="page-header">
        <div />
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FaPlus /> Nueva Requisición
          </button>
        )}
      </div>

      <div className="search-bar">
        <FaSearch style={{ color: '#aaa' }} />
        <input
          placeholder="Buscar por folio, solicitante o destino..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>{filtered.length} registros</span>
      </div>

      <div className="table-wrapper">
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Solicitante</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>Almacén</th>
                <th>Autorizador</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin requisiciones</td></tr>
              ) : filtered.map(r => {
                const req = r as any;
                const statusName = req.status?.name || '';
                const isPending = ['PENDIENTE', 'EN REVISION'].some(s => statusName.toUpperCase().includes(s));
                return (
                  <tr key={r.id}>
                    <td><strong style={{ color: '#1D6B42' }}>#{r.folio}</strong></td>
                    <td>{r.solicitorName}</td>
                    <td>{req.destination?.name || '—'}</td>
                    <td><span className={`badge ${statusColor(statusName)}`}>{statusName || '—'}</span></td>
                    <td><AuthBadge approved={req.almacenApproved} /></td>
                    <td><AuthBadge approved={req.autorizadorApproved} /></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString('es-MX')}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" title="Ver detalle" onClick={() => setSelected(r)}><FaEye /></button>
                        <button className="btn btn-sm" title="Imprimir"
                          style={{ background: '#7B4B27', color: 'white', padding: '3px 8px', fontSize: 11 }}
                          onClick={() => handlePrint(r)}>
                          <FaPrint />
                        </button>
                        {canAuthorize && isPending && (
                          <button className="btn btn-sm" title="Autorizar / Rechazar"
                            style={{ background: '#0d6efd', color: 'white', padding: '3px 8px', fontSize: 11 }}
                            onClick={() => setAuthorizing(r)}>
                            <FaStamp />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <DetailModal
          req={selected}
          onClose={() => setSelected(null)}
          onPrint={() => handlePrint(selected)}
          canAuthorize={canAuthorize}
          onAuthorize={() => { setAuthorizing(selected); setSelected(null); }}
        />
      )}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />
      )}
      {authorizing && (
        <AuthorizeModal req={authorizing} onClose={() => setAuthorizing(null)} onDone={() => { setAuthorizing(null); load(); }} />
      )}
    </Layout>
  );
}

// ─── Badge de autorización ────────────────────────────────────────────────────
function AuthBadge({ approved }: { approved?: boolean | null }) {
  if (approved === true)  return <FaCheckCircle color="#1D6B42" title="Aprobado" />;
  if (approved === false) return <FaTimesCircle color="#dc3545" title="Rechazado" />;
  return <FaClock color="#aaa" title="Pendiente" />;
}

// ─── Modal detalle ────────────────────────────────────────────────────────────
function DetailModal({ req, onClose, onPrint, canAuthorize, onAuthorize }: {
  req: Requisition; onClose: () => void; onPrint: () => void; canAuthorize: boolean; onAuthorize: () => void;
}) {
  const r = req as any;
  const statusName = r.status?.name || '';
  const isPending = ['PENDIENTE', 'EN REVISION'].some(s => statusName.toUpperCase().includes(s));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg">
        <div className="modal__header">
          <h3>Requisición #{req.folio}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 14, fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>SOLICITANTE</span><br /><strong>{req.solicitorName}</strong></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>DESTINO</span><br /><strong>{r.destination?.name || '—'}</strong></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>ESTADO</span><br /><span className={`badge ${statusColor(statusName)}`}>{statusName || '—'}</span></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>FECHA</span><br /><strong>{new Date(req.createdAt).toLocaleDateString('es-MX')}</strong></div>
          </div>

          {/* Doble autorización */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#f0faf5', border: '1px solid #cce8d8', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 4 }}>FIRMA 1 – ENCARGADO DE ALMACÉN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AuthBadge approved={r.almacenApproved} />
                <span style={{ fontSize: 12 }}>
                  {r.almacenApproved === true ? 'Aprobado' : r.almacenApproved === false ? 'Rechazado' : 'Pendiente'}
                  {r.almacenAuth?.email && ` — ${r.almacenAuth.email}`}
                </span>
              </div>
              {r.almacenAuthAt && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{new Date(r.almacenAuthAt).toLocaleString('es-MX')}</div>}
            </div>
            <div style={{ background: '#f0f6ff', border: '1px solid #b8d0f0', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 4 }}>FIRMA 2 – AUTORIZADOR / MESA DIRECTIVA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AuthBadge approved={r.autorizadorApproved} />
                <span style={{ fontSize: 12 }}>
                  {r.autorizadorApproved === true ? 'Aprobado' : r.autorizadorApproved === false ? 'Rechazado' : 'Pendiente'}
                  {r.authorizer?.email && ` — ${r.authorizer.email}`}
                </span>
              </div>
              {r.autorizadorAuthAt && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{new Date(r.autorizadorAuthAt).toLocaleString('es-MX')}</div>}
            </div>
          </div>

          {req.observations && <div style={{ fontSize: 12, marginBottom: 12, color: '#555' }}><strong>Obs:</strong> {req.observations}</div>}

          <div className="table-wrapper">
            <table>
              <thead><tr><th>Producto</th><th>Unidad</th><th>Cantidad</th><th>Notas</th></tr></thead>
              <tbody>
                {(req.details || []).map((d: any) => (
                  <tr key={d.id}>
                    <td><strong>{d.product?.marca}</strong>{d.product?.modelo ? ' ' + d.product.modelo : ''}</td>
                    <td style={{ fontSize: 12 }}>{d.product?.unit || '—'}</td>
                    <td>{d.quantity}</td>
                    <td style={{ fontSize: 12 }}>{d.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          {canAuthorize && isPending && (
            <button className="btn btn-sm" style={{ background: '#0d6efd', color: 'white' }} onClick={onAuthorize}>
              <FaStamp style={{ marginRight: 6 }} />Autorizar / Rechazar
            </button>
          )}
          <button className="btn btn-primary" onClick={onPrint} style={{ background: '#7B4B27' }}>
            <FaPrint style={{ marginRight: 6 }} />Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal autorizar ──────────────────────────────────────────────────────────
function AuthorizeModal({ req, onClose, onDone }: { req: Requisition; onClose: () => void; onDone: () => void }) {
  const { role } = useAuth();
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAlmacen = role === 'ALMACEN';
  const firmaLabel = isAlmacen ? 'Encargado de Almacén' : 'Autorizador / Mesa Directiva';

  const r = req as any;
  const mySignAlreadyDone = isAlmacen
    ? r.almacenApproved !== null && r.almacenApproved !== undefined
    : r.autorizadorApproved !== null && r.autorizadorApproved !== undefined;

  const handle = async (approved: boolean) => {
    setSaving(true);
    setError('');
    try {
      await requisitionsService.authorize(req.id, { approved, observations: observations || undefined });
      onDone();
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.message || e.message || 'Error al procesar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal__header">
          <h3>Autorizar Requisición #{req.folio}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}

          {mySignAlreadyDone && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#856404' }}>
              ⚠️ Ya firmaste esta requisición. Si continúas, se sobreescribirá tu decisión anterior.
            </div>
          )}

          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#555', fontSize: 11 }}>TU ROL EN ESTA FIRMA</div>
            <div style={{ color: '#1D6B42', fontWeight: 700 }}>{firmaLabel}</div>
          </div>

          <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
            Solicitante: <strong>{req.solicitorName}</strong><br />
            Artículos: <strong>{(req.details || []).length}</strong>
          </p>

          {/* Estado de ambas firmas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 11, padding: '6px 8px', borderRadius: 6, background: '#f0faf5', border: '1px solid #cce8d8' }}>
              <div style={{ color: '#888', marginBottom: 2 }}>FIRMA ALMACÉN</div>
              <AuthBadge approved={(req as any).almacenApproved} />
              {' '}{(req as any).almacenApproved === true ? 'Aprobado' : (req as any).almacenApproved === false ? 'Rechazado' : 'Pendiente'}
            </div>
            <div style={{ fontSize: 11, padding: '6px 8px', borderRadius: 6, background: '#f0f6ff', border: '1px solid #b8d0f0' }}>
              <div style={{ color: '#888', marginBottom: 2 }}>FIRMA AUTORIZADOR</div>
              <AuthBadge approved={(req as any).autorizadorApproved} />
              {' '}{(req as any).autorizadorApproved === true ? 'Aprobado' : (req as any).autorizadorApproved === false ? 'Rechazado' : 'Pendiente'}
            </div>
          </div>

          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '6px 10px', marginBottom: 14, fontSize: 11, color: '#795548' }}>
            ℹ️ La requisición cambia a <strong>AUTORIZADA</strong> solo cuando <strong>ambas firmas</strong> estén aprobadas.
          </div>

          <div className="form-group">
            <label>Observaciones (opcional)</label>
            <textarea rows={3} value={observations} onChange={e => setObservations(e.target.value)}
              placeholder="Comentarios..." style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-sm" style={{ background: '#dc3545', color: 'white' }}
            onClick={() => handle(false)} disabled={saving}>
            <FaTimes style={{ marginRight: 4 }} />Rechazar
          </button>
          <button className="btn btn-sm" style={{ background: '#1D6B42', color: 'white' }}
            onClick={() => handle(true)} disabled={saving}>
            <FaStamp style={{ marginRight: 4 }} />{saving ? 'Procesando...' : 'Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear requisición ──────────────────────────────────────────────────
interface DetailRow { productId: string; quantity: number; notes: string; }

function CreateModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [products, setProducts]       = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [nextFolio, setNextFolio]     = useState('');
  const [form, setForm] = useState({ solicitorName: '', destinationId: '', observations: '' });
  const [rows, setRows] = useState<DetailRow[]>([{ productId: '', quantity: 1, notes: '' }]);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      productsService.list().catch(() => []),
      costCentersService.list().catch(() => []),
      requisitionsService.getNextFolio?.().catch(() => null),
    ]).then(([p, c, f]) => {
      setProducts(p.filter((x: any) => x.isActive !== false));
      setCostCenters(c.filter((x: any) => x.isActive !== false));
      if (f?.folio) setNextFolio(f.folio);
    });
  }, []);

  const addRow    = () => setRows(prev => [...prev, { productId: '', quantity: 1, notes: '' }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof DetailRow, value: any) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    setError('');
    if (!form.solicitorName.trim()) { setError('El nombre del solicitante es requerido'); return; }
    if (!form.destinationId) { setError('El destino es requerido'); return; }
    if (rows.every(r => !r.productId)) { setError('Agrega al menos un producto'); return; }

    setSaving(true);
    try {
      await requisitionsService.create({
        solicitorName: form.solicitorName,
        destinationId: form.destinationId,
        observations: form.observations || undefined,
        details: rows.filter(r => r.productId).map(r => ({
          productId: r.productId,
          quantity: r.quantity,
          observations: r.notes || undefined,
        })),
      });
      onSave();
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.message || e.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800, width: '94vw' }}>
        <div className="modal__header">
          <h3>Nueva Requisición {nextFolio ? `— Folio #${nextFolio}` : ''}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '7px 12px', marginBottom: 12, fontSize: 12, color: '#856404' }}>
            Estado inicial: <strong>PENDIENTE</strong> — Requiere aprobación de Almacén y Autorizador.
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Solicitante *</label>
              <input value={form.solicitorName} onChange={e => setForm(p => ({ ...p, solicitorName: e.target.value }))} placeholder="Nombre de quien solicita" />
            </div>
            <div className="form-group">
              <label>Destino / Cargo *</label>
              <select value={form.destinationId} onChange={e => setForm(p => ({ ...p, destinationId: e.target.value }))}>
                <option value="">Seleccionar destino...</option>
                {costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <input value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} placeholder="Observaciones generales..." />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: '#7B4B27', fontSize: 13 }}>Artículos a Requisitar</strong>
              <button className="btn btn-outline btn-sm" onClick={addRow}><FaPlus style={{ marginRight: 4 }} />Agregar</button>
            </div>
            <div className="table-wrapper" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Producto</th>
                    <th style={{ width: '16%' }}>Cant.</th>
                    <th style={{ width: '28%' }}>Notas</th>
                    <th style={{ width: '6%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={row.productId} onChange={e => updateRow(idx, 'productId', e.target.value)} style={{ width: '100%', fontSize: 12, padding: '3px 4px' }}>
                          <option value="">Seleccionar...</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.marca}{p.modelo ? ' ' + p.modelo : ''}{p.sku ? ' (' + p.sku + ')' : ''}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="number" min="1" value={row.quantity} onChange={e => updateRow(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ width: '100%', fontSize: 12, padding: '3px 4px' }} />
                      </td>
                      <td>
                        <input value={row.notes} onChange={e => updateRow(idx, 'notes', e.target.value)} placeholder="Nota..." style={{ width: '100%', fontSize: 12, padding: '3px 4px' }} />
                      </td>
                      <td>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: 14 }}>×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Requisición'}
          </button>
        </div>
      </div>
    </div>
  );
}
