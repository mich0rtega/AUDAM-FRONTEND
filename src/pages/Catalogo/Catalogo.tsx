import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { catalogoService } from '../../services/catalogoService';
import { FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';

type Tab = 'product-types' | 'movement-types' | 'asset-categories' | 'product-statuses' | 'requisition-statuses';

export default function Catalogo() {
  const [tab, setTab]           = useState<Tab>('product-types');
  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState<any>({ name: '', description: '', direction: 'IN' });
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    setData([]);
    try {
      switch (tab) {
        case 'product-types':       setData(await catalogoService.listProductTypes()); break;
        case 'movement-types':      setData(await catalogoService.listMovementTypes()); break;
        case 'asset-categories':    setData(await catalogoService.listAssetCategories()); break;
        case 'product-statuses':    setData(await catalogoService.listProductStatuses()); break;
        case 'requisition-statuses':setData(await catalogoService.listRequisitionStatuses()); break;
      }
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      switch (tab) {
        case 'product-types':       await catalogoService.createProductType({ name: form.name, description: form.description }); break;
        case 'movement-types':      await catalogoService.createMovementType({ name: form.name, direction: form.direction }); break;
        case 'asset-categories':    await catalogoService.createAssetCategory({ name: form.name }); break;
        case 'product-statuses':    await catalogoService.createProductStatus({ name: form.name }); break;
        case 'requisition-statuses':await catalogoService.createRequisitionStatus({ name: form.name }); break;
      }
      setShowModal(false);
      setForm({ name: '', description: '', direction: 'IN' });
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id: string) => {
    try {
      switch (tab) {
        case 'product-types':    await catalogoService.toggleProductType(id); break;
        case 'product-statuses': await catalogoService.toggleProductStatus(id); break;
      }
      load();
    } catch {}
  };

  const tabLabels: Record<Tab, string> = {
    'product-types':        'Tipos de Producto',
    'movement-types':       'Tipos de Movimiento',
    'asset-categories':     'Categorías de Activos',
    'product-statuses':     'Status de Producto',
    'requisition-statuses': 'Status de Requisición',
  };

  const canToggle = ['product-types', 'product-statuses'].includes(tab);

  return (
    <Layout>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-secondary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {tabLabels[t]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setForm({ name: '', description: '', direction: 'IN' }); }}>
          <FaPlus /> Nuevo
        </button>
      </div>

      <div className="table-wrapper">
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {tab === 'product-types' && <th>Descripción</th>}
                {tab === 'movement-types' && <th>Dirección</th>}
                <th>Estado</th>
                {canToggle && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin registros</td></tr>
              ) : data.map((item: any) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  {tab === 'product-types' && <td>{item.description || '—'}</td>}
                  {tab === 'movement-types' && (
                    <td><span className={`badge ${item.direction === 'IN' ? 'badge-green' : 'badge-red'}`}>{item.direction === 'IN' ? '⬆ Entrada' : '⬇ Salida'}</span></td>
                  )}
                  <td><span className={`badge ${item.isActive !== false ? 'badge-green' : 'badge-gray'}`}>{item.isActive !== false ? 'Activo' : 'Inactivo'}</span></td>
                  {canToggle && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleToggle(item.id)} style={{ fontSize: 11 }}>
                        {item.isActive !== false ? <FaToggleOn color="#1D6B42" /> : <FaToggleOff color="#aaa" />}
                        {' '}{item.isActive !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal__header">
              <h3>Nuevo: {tabLabels[tab]}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal__body">
              {error && <div className="error-msg">{error}</div>}
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nombre..." />
              </div>
              {tab === 'product-types' && (
                <div className="form-group">
                  <label>Descripción</label>
                  <input value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
                </div>
              )}
              {tab === 'movement-types' && (
                <div className="form-group">
                  <label>Dirección *</label>
                  <select value={form.direction} onChange={e => setForm((p: any) => ({ ...p, direction: e.target.value }))}>
                    <option value="IN">IN – Entrada</option>
                    <option value="OUT">OUT – Salida</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
