import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { costCentersService } from '../../services/costCentersService';
import { CostCenter } from '../../types';
import { FaPlus } from 'react-icons/fa';

export default function CentrosCosto() {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const d = await costCentersService.list(); setCenters(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      await costCentersService.create(form);
      setShowModal(false);
      setForm({ name: '', code: '' });
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const toggle = async (id: string) => {
    try { await costCentersService.toggle(id); load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <div />
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setForm({ name: '', code: '' }); }}><FaPlus /> Nuevo Centro de Costo</button>
      </div>
      <div className="table-wrapper">
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {centers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin centros de costo</td></tr>
              ) : centers.map(c => (
                <tr key={c.id}>
                  <td>{c.code || '—'}</td>
                  <td><strong>{c.name}</strong></td>
                  <td><span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>{c.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggle(c.id)}>
                      {c.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal__header">
              <h3>Nuevo Centro de Costo</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal__body">
              {error && <div className="error-msg">{error}</div>}
              <div className="form-group"><label>Nombre *</label><input name="name" value={form.name} onChange={handleChange} /></div>
              <div className="form-group"><label>Código</label><input name="code" value={form.code} onChange={handleChange} placeholder="Ej: CC-001" /></div>
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
