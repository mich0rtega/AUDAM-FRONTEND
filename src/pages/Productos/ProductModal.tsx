import React, { useState, useEffect, useRef } from 'react';
import { productsService } from '../../services/productsService';
import { providersService } from '../../services/providersService';
import { catalogoService } from '../../services/catalogoService';
import { Product } from '../../types';

interface Props {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductModal({ product, onClose, onSave }: Props) {
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    marca: product?.marca || '',
    modelo: product?.modelo || '',
    especificacion: product?.especificacion || '',
    typeId: product?.typeId || '',
    statusId: product?.statusId || '',
    proveedorId: product?.proveedorId || '',
  });

  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [precio, setPrecio] = useState(product?.precioUnitario?.toString() || '0');
  const [stockInicial, setStockInicial] = useState('0');
  const [imagePreview, setImagePreview] = useState<string>((product as any)?.imagenUrl || '');
  const [imagenUrl, setImagenUrl] = useState<string>((product as any)?.imagenUrl || '');

  const [types, setTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      catalogoService.listProductTypes().catch(() => []),
      catalogoService.listProductStatuses().catch(() => []),
      providersService.list().catch(() => []),
    ]).then(([t, s, p]) => {
      setTypes(t.filter((x: any) => x.isActive !== false));
      setStatuses(s.filter((x: any) => x.isActive !== false));
      setProviders(p.filter((x: any) => x.isActive !== false));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe superar 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImagenUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImagenUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.marca.trim()) { setError('La marca es requerida'); return; }
    if (!form.statusId) { setError('El estado es requerido'); return; }
    if (!isEdit && !form.typeId) { setError('El tipo de producto es requerido'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await productsService.update(product!.id, {
          marca: form.marca,
          modelo: form.modelo || undefined,
          especificacion: form.especificacion || undefined,
          statusId: form.statusId,
          proveedorId: form.proveedorId || undefined,
          imagenUrl: imagenUrl || null,
        });
      } else {
        await productsService.create({
          marca: form.marca,
          modelo: form.modelo || undefined,
          especificacion: form.especificacion || undefined,
          typeId: form.typeId,
          statusId: form.statusId,
          proveedorId: form.proveedorId || undefined,
          sku: sku || undefined,
          unit: unit || undefined,
          precioUnitario: parseFloat(precio) || 0,
          stockActual: parseInt(stockInicial) || 0,
          imagenUrl: imagenUrl || undefined,
        });
      }
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
          <h3>{isEdit ? `Editar: ${product!.marca}` : 'Nuevo Producto'}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {error && <div className="error-msg">{error}</div>}

          {/* Imagen opcional */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
            background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: 10, padding: 14 }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Producto"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8,
                  border: '1px solid #ddd', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#e9ecef',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 28, color: '#aaa' }}>📦</div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#555' }}>
                Imagen del producto <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? '📷 Cambiar imagen' : '📷 Agregar imagen'}
                </button>
                {imagePreview && (
                  <button type="button" className="btn btn-sm"
                    style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}
                    onClick={handleRemoveImage}>🗑 Quitar</button>
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
              <input name="marca" value={form.marca} onChange={handleChange} placeholder="Ej: Truper" />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Número de modelo" />
            </div>

            <div className="form-group">
              <label>SKU {isEdit && <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>(no editable)</span>}</label>
              {isEdit
                ? <input value={product!.sku || '—'} readOnly style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
                : <input value={sku} onChange={e => setSku(e.target.value)} placeholder="Código interno" />}
            </div>

            <div className="form-group">
              <label>Unidad {isEdit && <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>(no editable)</span>}</label>
              {isEdit
                ? <input value={product!.unit || '—'} readOnly style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
                : <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="pza, kg, L, m..." />}
            </div>

            <div className="form-group">
              <label>Precio Unitario {isEdit && <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>(usa ✏ en tabla)</span>}</label>
              {isEdit
                ? <input value={`$${Number(product!.precioUnitario).toFixed(2)}`} readOnly style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
                : <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} min="0" step="0.01" />}
            </div>

            {!isEdit && (
              <div className="form-group">
                <label>Stock Inicial</label>
                <input type="number" value={stockInicial} onChange={e => setStockInicial(e.target.value)} min="0" placeholder="0" />
              </div>
            )}

            <div className="form-group">
              <label>Tipo de Producto {isEdit && <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>(no editable)</span>}</label>
              {isEdit
                ? <input value={(product as any).type?.name || product!.typeId} readOnly style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
                : (
                  <select name="typeId" value={form.typeId} onChange={handleChange}>
                    <option value="">Seleccionar...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
            </div>

            <div className="form-group">
              <label>Estado *</label>
              <select name="statusId" value={form.statusId} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Proveedor</label>
              <select name="proveedorId" value={form.proveedorId} onChange={handleChange}>
                <option value="">Sin proveedor</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Especificación / Descripción</label>
              <textarea name="especificacion" value={form.especificacion} onChange={handleChange}
                rows={3} placeholder="Detalles adicionales..." style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
