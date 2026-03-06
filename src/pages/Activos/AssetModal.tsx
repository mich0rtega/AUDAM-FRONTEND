import React, { useState, useEffect, useRef } from 'react';
import { assetsService } from '../../services/assetsService';
import { catalogoService } from '../../services/catalogoService';
import { usersService } from '../../services/usersService';
import { Asset } from '../../types';

interface Props {
  asset: Asset | null;
  onClose: () => void;
  onSave: () => void;
}

export default function AssetModal({ asset, onClose, onSave }: Props) {
  const isEdit = !!asset;
  const a = asset as any;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    marca:       a?.marca || '',
    modelo:      a?.modelo || '',
    numeroSerie: a?.numeroSerie || '',
    categoryId:  a?.categoryId || '',
    statusId:    a?.statusId || '',
    stockActual: a?.stockActual?.toString() || '',
  
    ubicacion:         a?.ubicacion || '',
    responsableId:     a?.responsableId || '',
    responsableNombre: a?.responsableNombre || '',
    centroCosto:       a?.centroCosto || '',
  });

  const [modoResponsable, setModoResponsable] = useState<'user' | 'libre'>(
    a?.responsableNombre && !a?.responsableId ? 'libre' : 'user'
  );

  const [imagePreview, setImagePreview] = useState<string>(a?.imagenUrl || '');
  const [imagenUrl, setImagenUrl]       = useState<string>(a?.imagenUrl || '');
  const [categories, setCategories]     = useState<any[]>([]);
  const [statuses, setStatuses]         = useState<any[]>([]);
  const [users, setUsers]               = useState<any[]>([]);
  const [error, setError]               = useState('');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    Promise.all([
      catalogoService.listAssetCategories().catch(() => []),
      catalogoService.listProductStatuses().catch(() => []),
      usersService.listAll().catch(() => usersService.list().catch(() => [])),
    ]).then(([c, s, u]) => {
      setCategories(c.filter((x: any) => x.isActive !== false));
      setStatuses(s.filter((x: any) => x.isActive !== false));
      setUsers(u.filter((x: any) => x.isActive !== false));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe superar 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => { const r = ev.target?.result as string; setImagePreview(r); setImagenUrl(r); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.marca.trim()) { setError('La marca es requerida'); return; }
    if (!form.categoryId)   { setError('La categoría es requerida'); return; }
    if (!form.statusId)     { setError('El estado es requerido'); return; }

    if (!isEdit) {
      if (modoResponsable === 'user' && !form.responsableId) { setError('Selecciona un responsable'); return; }
      if (modoResponsable === 'libre' && !form.responsableNombre.trim()) { setError('Escribe el nombre del responsable'); return; }
    }

    setSaving(true);
    try {
      const payload: any = {
        marca:       form.marca,
        modelo:      form.modelo || null,
        numeroSerie: form.numeroSerie || null,
        categoryId:  form.categoryId,
        statusId:    form.statusId,
        stockActual: form.stockActual ? parseInt(form.stockActual) : null,
        imagenUrl:   imagenUrl || null,
      };


      if (!isEdit) {
        payload.responsableId     = modoResponsable === 'user' ? form.responsableId : null;
        payload.responsableNombre = modoResponsable === 'libre' ? form.responsableNombre : null;
        payload.centroCosto       = form.centroCosto || null;
        payload.ubicacion         = form.ubicacion || null;
      }

      if (isEdit) await assetsService.update(asset!.id, payload);
      else        await assetsService.create(payload);
      onSave();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg">
        <div className="modal__header">
          <h3>{isEdit ? `Editar: ${asset!.marca}` : 'Nuevo Activo'}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}

          {/* Aviso en modo edición */}
          {isEdit && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
              padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
              ℹ️ Para cambiar <strong>responsable</strong>, <strong>centro de costo</strong> o <strong>ubicación</strong>,
              usa la función de <strong>Transferencia</strong> desde el detalle del activo.
            </div>
          )}

          {/* Imagen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
            background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: 10, padding: 14 }}>
            {imagePreview
              ? <img src={imagePreview} alt="Activo" style={{ width: 80, height: 80, objectFit: 'cover',
                  borderRadius: 8, border: '1px solid #ddd', flexShrink: 0 }} />
              : <div style={{ width: 80, height: 80, borderRadius: 8, background: '#e9ecef',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 28, color: '#aaa' }}>🔧</div>
            }
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#555' }}>
                Imagen del activo <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? '📷 Cambiar imagen' : '📷 Agregar imagen'}
                </button>
                {imagePreview && (
                  <button type="button" className="btn btn-sm"
                    style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}
                    onClick={() => { setImagePreview(''); setImagenUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    🗑 Quitar
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>JPG, PNG o WebP · máx 2 MB</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Marca *</label>
              <input name="marca" value={form.marca} onChange={handleChange} placeholder="Ej: Caterpillar, Bosch..." />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Número de modelo" />
            </div>

            <div className="form-group">
              <label>No. de Serie</label>
              <input name="numeroSerie" value={form.numeroSerie} onChange={handleChange} placeholder="Número de serie" />
            </div>
            <div className="form-group">
              <label>Cantidad</label>
              <input type="number" name="stockActual" value={form.stockActual}
                onChange={handleChange} min="0" placeholder="1" />
            </div>

            <div className="form-group">
              <label>Categoría *</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estado *</label>
              <select name="statusId" value={form.statusId} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Campos solo visibles al CREAR */}
            {!isEdit && (
              <>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Responsable *</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {(['user', 'libre'] as const).map(modo => (
                      <button key={modo} type="button"
                        onClick={() => setModoResponsable(modo)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                          background: modoResponsable === modo ? '#1D6B42' : 'white',
                          color:      modoResponsable === modo ? 'white'   : '#666',
                          borderColor: modoResponsable === modo ? '#1D6B42' : '#ddd',
                        }}>
                        {modo === 'user' ? '👤 Usuario del sistema' : '✏️ Nombre libre'}
                      </button>
                    ))}
                  </div>
                  {modoResponsable === 'user' ? (
                    <select name="responsableId" value={form.responsableId} onChange={handleChange}>
                      <option value="">Seleccionar usuario...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  ) : (
                    <input name="responsableNombre" value={form.responsableNombre} onChange={handleChange}
                      placeholder="Nombre del responsable" />
                  )}
                </div>

                <div className="form-group">
                  <label>Centro de Costo</label>
                  <input name="centroCosto" value={form.centroCosto} onChange={handleChange}
                    placeholder="Ej: Mantenimiento, Producción..." />
                </div>
                <div className="form-group">
                  <label>Ubicación</label>
                  <input name="ubicacion" value={form.ubicacion} onChange={handleChange}
                    placeholder="Bodega, área, piso..." />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Activo'}
          </button>
        </div>
      </div>
    </div>
  );
}
