import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { usersService } from '../../services/usersService';
import { FaPlus, FaSearch, FaUserSlash, FaUserCheck, FaEdit, FaEye, FaGlobe } from 'react-icons/fa';

const ROLES = ['ADMIN', 'ALMACEN', 'AUTORIZADOR', 'COMPRAS', 'USUARIO'];

export default function Usuarios() {
  const [users, setUsers]         = useState<any[]>([]);
  const [filtered, setFiltered]   = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]   = useState<any | null>(null);
  const [viewUser, setViewUser]   = useState<any | null>(null);
  const [envUser, setEnvUser]     = useState<any | null>(null);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [data, envs] = await Promise.all([
        usersService.listAll(),
        usersService.listEnvironments().catch(() => [])
      ]);
      setUsers(data);
      setEnvironments(envs);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cargar usuarios');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => u.email.toLowerCase().includes(q)));
  }, [search, users]);

  const handleToggle = async (user: any) => {
    try {
      if (user.isActive) await usersService.disable(user.id);
      else await usersService.enable(user.id);
      setSuccess(`Usuario ${user.email} ${user.isActive ? 'desactivado' : 'activado'}`);
      load();
    } catch (e: any) { setError(e.response?.data?.message || 'Error'); }
    setTimeout(() => setSuccess(''), 3000);
  };

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  return (
    <Layout>
      <div className="page-header">
        <div />
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <FaPlus /> Nuevo Usuario
        </button>
      </div>

      {error && <div className="error-msg" onClick={() => setError('')}>{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="search-bar">
        <FaSearch style={{ color: '#aaa' }} />
        <input placeholder="Buscar por email..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>{filtered.length} usuarios</span>
      </div>

      <div className="table-wrapper">
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Estado</th>
                <th>Entornos</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin usuarios</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.email}</strong></td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(u.environments || []).map((ue: any) => (
                        <span key={ue.environmentId} className="badge badge-blue" style={{ fontSize: 10 }}>
                          {ue.environment?.name || ue.environmentId} — {ue.role}
                        </span>
                      ))}
                      {!(u.environments?.length) && <span style={{ fontSize: 11, color: '#aaa' }}>Sin entornos</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: '#888' }}>{new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-outline btn-sm" title="Ver detalle" onClick={() => setViewUser(u)}><FaEye /></button>
                      <button className="btn btn-outline btn-sm" title="Editar" onClick={() => setEditUser(u)}><FaEdit /></button>
                      <button className="btn btn-outline btn-sm" title="Gestionar entornos" onClick={() => setEnvUser(u)}><FaGlobe /></button>
                      <button className="btn btn-outline btn-sm" title={u.isActive ? 'Desactivar' : 'Activar'} onClick={() => handleToggle(u)}>
                        {u.isActive ? <FaUserSlash color="#dc3545" /> : <FaUserCheck color="#1D6B42" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); flash('Usuario creado'); }} />}
      {editUser   && <EditModal   user={editUser}  onClose={() => setEditUser(null)}  onSave={() => { setEditUser(null); load(); flash('Usuario actualizado'); }} />}
      {viewUser   && <ViewModal   user={viewUser}  onClose={() => setViewUser(null)} />}
      {envUser    && <EnvModal    user={envUser}   environments={environments} onClose={() => setEnvUser(null)} onSave={() => { setEnvUser(null); load(); flash('Entornos actualizados'); }} />}
    </Layout>
  );
}

// ─── Modal: Crear usuario ─────────────────────────────────────────────────────
function CreateModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handle = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Email y contraseña son requeridos'); return; }
    setSaving(true);
    try { await usersService.create(form); onSave(); }
    catch (e: any) { setError(e.response?.data?.message || 'Error al crear'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal__header"><h3>Nuevo Usuario</h3><button className="modal__close" onClick={onClose}>×</button></div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group"><label>Correo electrónico *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="usuario@correo.com" /></div>
          <div className="form-group"><label>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Contraseña segura..." /></div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? 'Creando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Editar usuario ────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ email: user.email, password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handle = async () => {
    setError('');
    if (!form.email) { setError('El email es requerido'); return; }
    setSaving(true);
    try {
      const data: any = { email: form.email };
      if (form.password.trim()) data.password = form.password;
      await usersService.update(user.id, data);
      onSave();
    }
    catch (e: any) { setError(e.response?.data?.message || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal__header"><h3>Editar Usuario</h3><button className="modal__close" onClick={onClose}>×</button></div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group"><label>Correo electrónico *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label>Nueva contraseña <span style={{ fontWeight: 400, color: '#888', fontSize: 11 }}>(dejar vacío para no cambiar)</span></label><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Nueva contraseña..." /></div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Ver usuario ────────────────────────────────────────────────────────
function ViewModal({ user, onClose }: { user: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal__header"><h3>Detalle de Usuario</h3><button className="modal__close" onClick={onClose}>×</button></div>
        <div className="modal__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 13 }}>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>ID</span><br /><span style={{ wordBreak: 'break-all', fontSize: 11 }}>{user.id}</span></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>EMAIL</span><br /><strong>{user.email}</strong></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>ESTADO</span><br /><span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span></div>
            <div><span style={{ color: '#aaa', fontSize: 11 }}>CREADO</span><br />{new Date(user.createdAt).toLocaleDateString('es-MX')}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 8 }}>ENTORNOS ASIGNADOS</div>
            {(user.environments || []).length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 12 }}>Sin entornos asignados</div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ textAlign: 'left', padding: '4px 8px', background: '#f5f5f5' }}>Entorno</th><th style={{ textAlign: 'left', padding: '4px 8px', background: '#f5f5f5' }}>Rol</th><th style={{ padding: '4px 8px', background: '#f5f5f5' }}>Estado</th></tr></thead>
                <tbody>
                  {user.environments.map((ue: any) => (
                    <tr key={ue.environmentId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '4px 8px' }}>{ue.environment?.name || ue.environmentId}</td>
                      <td style={{ padding: '4px 8px' }}><span className="badge badge-blue" style={{ fontSize: 10 }}>{ue.role}</span></td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}><span className={`badge ${ue.isActive ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>{ue.isActive ? 'Activo' : 'Revocado'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="modal__footer"><button className="btn btn-outline" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}

// ─── Modal: Gestionar entornos ─────────────────────────────────────────────────
function EnvModal({ user, environments, onClose, onSave }: { user: any; environments: any[]; onClose: () => void; onSave: () => void }) {
  const [assigning, setAssigning] = useState(false);
  const [form, setForm]           = useState({ environmentId: '', role: 'USUARIO' });
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);

  const userEnvIds = (user.environments || []).map((ue: any) => ue.environmentId);
  const availableEnvs = environments.filter(e => !userEnvIds.includes(e.id));

  const handleAssign = async () => {
    setError('');
    if (!form.environmentId) { setError('Selecciona un entorno'); return; }
    setSaving(true);
    try {
      await usersService.assignRole({ userId: user.id, environmentId: form.environmentId, role: form.role });
      onSave();
    } catch (e: any) { setError(e.response?.data?.message || 'Error'); setSaving(false); }
  };

  const handleToggleEnv = async (ue: any) => {
    try {
      if (ue.isActive) await usersService.revokeEnvironment(ue.id);
      else await usersService.restoreEnvironment(ue.id);
      onSave();
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal__header"><h3>Entornos — {user.email}</h3><button className="modal__close" onClick={onClose}>×</button></div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}

          {/* Lista actual */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 8 }}>ENTORNOS ACTUALES</div>
            {(user.environments || []).length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 12 }}>Sin entornos asignados</div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ textAlign: 'left', padding: '4px 8px', background: '#f5f5f5' }}>Entorno</th><th style={{ padding: '4px 8px', background: '#f5f5f5' }}>Rol</th><th style={{ padding: '4px 8px', background: '#f5f5f5' }}>Estado</th><th style={{ padding: '4px 8px', background: '#f5f5f5' }}>Acción</th></tr></thead>
                <tbody>
                  {user.environments.map((ue: any) => (
                    <tr key={ue.environmentId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '4px 8px' }}>{ue.environment?.name || ue.environmentId}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}><span className="badge badge-blue" style={{ fontSize: 10 }}>{ue.role}</span></td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}><span className={`badge ${ue.isActive ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>{ue.isActive ? 'Activo' : 'Revocado'}</span></td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 10 }} onClick={() => handleToggleEnv(ue)}>
                          {ue.isActive ? 'Revocar' : 'Restaurar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Asignar nuevo entorno */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 8 }}>ASIGNAR NUEVO ENTORNO</div>
            {availableEnvs.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 12 }}>Ya tiene acceso a todos los entornos disponibles.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Entorno</label>
                  <select value={form.environmentId} onChange={e => setForm(p => ({ ...p, environmentId: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {availableEnvs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Rol</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {['ADMIN','ALMACEN','AUTORIZADOR','COMPRAS','USUARIO'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          {availableEnvs.length > 0 && (
            <button className="btn btn-primary" onClick={handleAssign} disabled={saving}>{saving ? 'Asignando...' : 'Asignar Entorno'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
