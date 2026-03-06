import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { providersService } from '../../services/providersService';
import { Provider } from '../../types';
import { FaPlus, FaEdit, FaSearch } from 'react-icons/fa';

export default function Proveedores() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filtered, setFiltered] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await providersService.list();
      setProviders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(providers.filter(p => p.nombre.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)));
  }, [search, providers]);

  const openNew = () => { setSelected(null); setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' }); setError(''); setShowModal(true); };
  const openEdit = (p: Provider) => { setSelected(p); setForm({ nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' }); setError(''); setShowModal(true); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.nombre) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (selected) await providersService.update(selected.id, form);
      else await providersService.create(form);
      setShowModal(false);
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const toggle = async (p: Provider) => {
    try { await providersService.toggle(p.id); load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <div />
        <button className="btn btn-primary" onClick={openNew}><FaPlus /> Nuevo Proveedor</button>
      </div>
      <div className="search-bar">
        <FaSearch style={{ color: '#aaa' }} />
        <input placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-wrapper">
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead>
              <tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin resultados</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.contacto || '—'}</td>
                  <td>{p.telefono || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.direccion || '—'}</td>
                  <td><span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><FaEdit /></button>
                      <button className={`btn btn-sm ${p.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggle(p)}>
                        {p.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
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
              <h3>{selected ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal__body">
              {error && <div className="error-msg">{error}</div>}
              <div className="form-group"><label>Nombre *</label><input name="nombre" value={form.nombre} onChange={handleChange} /></div>
              <div className="form-grid">
                <div className="form-group"><label>Contacto</label><input name="contacto" value={form.contacto} onChange={handleChange} /></div>
                <div className="form-group"><label>Teléfono</label><input name="telefono" value={form.telefono} onChange={handleChange} /></div>
                <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} /></div>
                <div className="form-group"><label>Dirección</label><input name="direccion" value={form.direccion} onChange={handleChange} /></div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
