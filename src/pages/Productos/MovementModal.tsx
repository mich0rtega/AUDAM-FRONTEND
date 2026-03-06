import React, { useState, useEffect } from 'react';
import { productsService } from '../../services/productsService';
import { catalogoService } from '../../services/catalogoService';
import { costCentersService } from '../../services/costCentersService';
import { Product, MovementType, CostCenter } from '../../types';

interface Props {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}

export default function MovementModal({ product, onClose, onSave }: Props) {
  const [typeId, setTypeId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [observations, setObservations] = useState('');
  const [movTypes, setMovTypes] = useState<MovementType[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      catalogoService.listMovementTypes().catch(() => []),
      costCentersService.list().catch(() => []),
    ]).then(([t, c]) => {
      setMovTypes(t.filter((x: any) => x.isActive));
      setCostCenters(c.filter((x: any) => x.isActive));
    });
  }, []);

  const selectedType = movTypes.find(t => t.id === typeId);
  const isOut = selectedType?.direction === 'OUT';

  const handleQtyChange = (val: string) => {
    const n = parseInt(val) || 0;
    if (isOut && n > product.stockActual) setQuantity(product.stockActual.toString());
    else setQuantity(val);
  };

  const handleSubmit = async () => {
    setError('');
    if (!typeId) { setError('Selecciona el tipo de movimiento'); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setError('La cantidad debe ser mayor a 0'); return; }
    if (isOut && qty > product.stockActual) {
      setError(`Stock insuficiente. Máximo disponible: ${product.stockActual}`);
      return;
    }
    setSaving(true);
    try {
      // Endpoint: POST /products/:id/movements
      // Body exacto que espera el backend: { typeId, quantity, unitPrice, direction, costCenterId, observations }
      await productsService.createMovement(product.id, {
        typeId,
        quantity: qty,
        unitPrice: Number(product.precioUnitario),
        direction: selectedType!.direction as 'IN' | 'OUT',
        costCenterId: costCenterId || undefined,
        observations: observations || undefined,
      });
      onSave();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h3>Registrar Movimiento</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {/* Info producto */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            <strong>{product.marca}</strong>{product.modelo ? ` ${product.modelo}` : ''}
            {product.sku && <span style={{ color: '#888' }}> — SKU: {product.sku}</span>}
            <div style={{ marginTop: 4 }}>
              Stock actual: <strong style={{ color: product.stockActual <= 5 ? '#dc3545' : '#1D6B42' }}>
                {product.stockActual} {product.unit || 'pzas'}
              </strong>
              {' | '}Precio: <strong>${Number(product.precioUnitario).toFixed(2)}</strong>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Tipo de Movimiento *</label>
            <select value={typeId} onChange={e => { setTypeId(e.target.value); setQuantity('1'); }}>
              <option value="">Seleccionar...</option>
              {movTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.direction === 'IN' ? '⬆' : '⬇'} {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedType && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 600,
              background: isOut ? '#f8d7da' : '#d4edda',
              color: isOut ? '#721c24' : '#155724'
            }}>
              {isOut ? '⬇ SALIDA — reducirá el stock' : '⬆ ENTRADA — aumentará el stock'}
            </div>
          )}

          <div className="form-group">
            <label>
              Cantidad *
              {isOut && <span style={{ color: '#dc3545', marginLeft: 8, fontWeight: 400, fontSize: 12 }}>(máx: {product.stockActual})</span>}
            </label>
            <input type="number" value={quantity} onChange={e => handleQtyChange(e.target.value)}
              min="1" max={isOut ? product.stockActual : undefined} />
          </div>

          <div className="form-group">
            <label>Precio Unitario <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>(no editable)</span></label>
            <input value={`$${Number(product.precioUnitario).toFixed(2)}`} readOnly
              style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label>Centro de Costo</label>
            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)}>
              <option value="">Sin asignar</option>
              {costCenters.map(c => (
                <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea value={observations} onChange={e => setObservations(e.target.value)}
              rows={2} placeholder="Motivo, referencia..." style={{ resize: 'vertical' }} />
          </div>

          {selectedType && parseInt(quantity) > 0 && (
            <div style={{ background: '#e8f5ee', border: '1px solid #c3e6cb', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
              <strong>Resumen:</strong> {isOut ? 'Salida' : 'Entrada'} de <strong>{quantity}</strong> {product.unit || 'pzas'} × ${Number(product.precioUnitario).toFixed(2)} =
              <strong> ${(parseInt(quantity || '0') * Number(product.precioUnitario)).toFixed(2)}</strong>
              {isOut && <div style={{ color: '#7B4B27', marginTop: 4 }}>Stock resultante: <strong>{product.stockActual - parseInt(quantity || '0')}</strong></div>}
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
