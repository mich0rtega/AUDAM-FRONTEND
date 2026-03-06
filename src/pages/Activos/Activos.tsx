import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { assetsService } from '../../services/assetsService';
import { catalogoService } from '../../services/catalogoService';
import { Asset } from '../../types';
import { FaPlus, FaEdit, FaSearch, FaEye, FaExchangeAlt, FaBoxes, FaEllipsisV } from 'react-icons/fa';
import AssetModal from './AssetModal';
import AssetDetailModal from './AssetDetailModal';
import AssetMovementModal from './AssetMovementModal';

/* ─── Menú de acciones por fila ─────────────────────────────────────────── */
function ActionMenu({ asset, onDetail, onEdit, onMovement, onStatus }: {
  asset: Asset;
  onDetail: () => void;
  onEdit: () => void;
  onMovement: () => void;
  onStatus: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="action-menu-wrap" ref={ref}>
      <button className="action-menu-btn" onClick={() => setOpen(o => !o)} title="Acciones">
        ⋮
      </button>
      {open && (
        <div className="action-menu-dropdown">
          <button onClick={() => { setOpen(false); onDetail(); }}>
            <FaEye style={{ color: '#555' }} /> Ver detalle
          </button>
          <button onClick={() => { setOpen(false); onEdit(); }}>
            <FaEdit style={{ color: '#0d6efd' }} /> Editar
          </button>
          <button onClick={() => { setOpen(false); onMovement(); }}>
            <FaBoxes style={{ color: '#17a2b8' }} /> Movimientos
          </button>
          <button onClick={() => { setOpen(false); onStatus(); }}>
            <FaExchangeAlt style={{ color: '#6f42c1' }} /> Cambiar estado
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function Activos() {
  const [assets, setAssets]     = useState<Asset[]>([]);
  const [filtered, setFiltered] = useState<Asset[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showModal, setShowModal]       = useState(false);
  const [showDetail, setShowDetail]     = useState(false);
  const [showStatus, setShowStatus]     = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [selected, setSelected]         = useState<Asset | null>(null);
  const [newStatusId, setNewStatusId]   = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const load = async () => {
    try {
      const [data, s] = await Promise.all([
        assetsService.list(),
        catalogoService.listProductStatuses().catch(() => []),
      ]);
      setAssets(data);
      setStatuses(s.filter((x: any) => x.isActive !== false));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let list = assets;
    if (filterStatus) list = list.filter(a => a.statusId === filterStatus);
    setFiltered(list.filter(a =>
      a.marca.toLowerCase().includes(q) ||
      (a.modelo || '').toLowerCase().includes(q) ||
      (a.numeroSerie || '').toLowerCase().includes(q) ||
      (a.ubicacion || '').toLowerCase().includes(q) ||
      ((a as any).category?.name || '').toLowerCase().includes(q)
    ));
  }, [search, assets, filterStatus]);

  const handleNew      = () => { setSelected(null); setShowModal(true); };
  const handleEdit     = (a: Asset) => { setSelected(a); setShowModal(true); };
  const handleDetail   = (a: Asset) => { setSelected(a); setShowDetail(true); };
  const handleStatus   = (a: Asset) => { setSelected(a); setNewStatusId(a.statusId); setShowStatus(true); };
  const handleMovement = (a: Asset) => { setSelected(a); setShowMovement(true); };

  const submitStatus = async () => {
    if (!selected || !newStatusId) return;
    setSavingStatus(true);
    try {
      await assetsService.changeStatus(selected.id, newStatusId);
      setShowStatus(false);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al cambiar estado');
    } finally { setSavingStatus(false); }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="page-header">
        <div />
        <button className="btn btn-primary" onClick={handleNew}>
          <FaPlus /> <span>Nuevo Activo</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <FaSearch style={{ color: '#aaa', flexShrink: 0 }} />
        <input
          placeholder="Buscar por marca, modelo, serie, categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ minWidth: 130, fontSize: 13, padding: '8px 10px',
            border: '1.5px solid #ddd', borderRadius: 6, background: 'white' }}
        >
          <option value="">Todos los estados</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Tabla con scroll horizontal en móvil */}
      <div className="table-wrapper">
        <div className="table-scroll">
          {loading ? (
            <div className="loading">Cargando activos...</div>
          ) : (
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Marca / Modelo</th>
                  <th className="col-hide-sm">Categoría</th>
                  <th className="col-hide-sm">No. Serie</th>
                  <th className="col-hide-md">Ubicación</th>
                  <th>Cant.</th>
                  <th>Estado</th>
                  <th className="col-hide-md">Responsable</th>
                  <th className="col-hide-md">C. Costo</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
                      Sin resultados
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    {/* Miniatura */}
                    <td style={{ padding: '6px 8px' }}>
                      {(a as any).imagenUrl ? (
                        <img src={(a as any).imagenUrl} alt={a.marca}
                          onClick={() => handleDetail(a)}
                          style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6,
                            border: '1px solid #ddd', cursor: 'pointer', display: 'block' }} />
                      ) : (
                        <div onClick={() => handleDetail(a)}
                          style={{ width: 34, height: 34, borderRadius: 6, background: '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, color: '#ccc', cursor: 'pointer', border: '1px solid #e0e0e0' }}>
                          🔧
                        </div>
                      )}
                    </td>

                    <td>
                      <strong style={{ fontSize: 13 }}>{a.marca}</strong>
                      {a.modelo && <span style={{ color: '#888', marginLeft: 4, fontSize: 12 }}>- {a.modelo}</span>}
                    </td>

                    <td className="col-hide-sm" style={{ fontSize: 12 }}>
                      {(a as any).category?.name || '—'}
                    </td>

                    <td className="col-hide-sm" style={{ fontSize: 12, color: '#666' }}>
                      {a.numeroSerie || '—'}
                    </td>

                    <td className="col-hide-md" style={{ fontSize: 12, color: '#666' }}>
                      {a.ubicacion || '—'}
                    </td>

                    <td>
                      {a.stockActual != null
                        ? <span className="badge badge-blue">{a.stockActual}</span>
                        : '—'}
                    </td>

                    <td>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>
                        {(a as any).status?.name || '—'}
                      </span>
                    </td>

                    <td className="col-hide-md" style={{ fontSize: 12, color: '#555' }}>
                      {(a as any).responsableNombre || (a as any).responsable?.email || '—'}
                    </td>

                    <td className="col-hide-md" style={{ fontSize: 12, color: '#666' }}>
                      {(a as any).centroCosto || '—'}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '6px 10px' }}>
                      <ActionMenu
                        asset={a}
                        onDetail={() => handleDetail(a)}
                        onEdit={() => handleEdit(a)}
                        onMovement={() => handleMovement(a)}
                        onStatus={() => handleStatus(a)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {showModal && (
        <AssetModal asset={selected} onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }} />
      )}
      {showDetail && selected && (
        <AssetDetailModal asset={selected} onClose={() => setShowDetail(false)}
          onEdit={() => { setShowDetail(false); setShowModal(true); }} />
      )}
      {showMovement && selected && (
        <AssetMovementModal asset={selected} onClose={() => setShowMovement(false)}
          onSave={() => { setShowMovement(false); load(); }} />
      )}

      {/* Modal cambio de estado */}
      {showStatus && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStatus(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header">
              <h3>Cambiar Estado</h3>
              <button className="modal__close" onClick={() => setShowStatus(false)}>×</button>
            </div>
            <div className="modal__body">
              <div style={{ marginBottom: 12, fontSize: 13, color: '#555' }}>
                <strong>{selected.marca}</strong>{selected.modelo ? ` ${selected.modelo}` : ''}
                {selected.numeroSerie && <span style={{ color: '#aaa' }}> — S/N: {selected.numeroSerie}</span>}
              </div>
              <div className="form-group">
                <label>Nuevo Estado</label>
                <select value={newStatusId} onChange={e => setNewStatusId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn-outline" onClick={() => setShowStatus(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={submitStatus}
                disabled={savingStatus || !newStatusId}>
                {savingStatus ? 'Guardando...' : 'Cambiar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
