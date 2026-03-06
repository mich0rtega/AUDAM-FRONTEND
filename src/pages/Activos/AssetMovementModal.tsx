import React, { useState, useEffect } from 'react';
import { assetsService } from '../../services/assetsService';
import { Asset } from '../../types';
import { FaArrowDown, FaArrowUp, FaPrint } from 'react-icons/fa';
import { printMovimientoActivo } from '../../utils/printUtils';

interface Props {
  asset: Asset;
  onClose: () => void;
  onSave: () => void;
}

interface Movement {
  id: string;
  action: string;
  createdAt: string;
  newValue: any;
  oldValue: any;
}

export default function AssetMovementModal({ asset, onClose, onSave }: Props) {
  const a = asset as any;

  const [tab, setTab]             = useState<'nuevo' | 'historial'>('nuevo');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity]   = useState('');
  const [observations, setObs]    = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const [movements, setMovements]     = useState<Movement[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const stockActual = a.stockActual ?? 0;

  const loadHistory = async () => {
    setLoadingHist(true);
    try { setMovements(await assetsService.listMovements(asset.id)); }
    catch (e) { console.error(e); }
    finally { setLoadingHist(false); }
  };

  useEffect(() => {
    if (tab === 'historial') loadHistory();
  }, [tab]);

  const handleSubmit = async () => {
    setError('');
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setError('La cantidad debe ser mayor a 0'); return; }
    if (direction === 'OUT' && qty > stockActual) {
      setError(`Stock insuficiente. Stock actual: ${stockActual}`); return;
    }
    setSaving(true);
    try {
      await assetsService.createMovement(asset.id, { direction, quantity: qty, observations });
      onSave();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error al registrar movimiento');
    } finally { setSaving(false); }
  };

  const handlePrint = (m: Movement) => {
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

  const dirBtn = (d: 'IN' | 'OUT', label: string, color: string, icon: React.ReactNode) => (
    <button type="button" onClick={() => setDirection(d)} style={{
      flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
      border: `2px solid ${direction === d ? color : '#ddd'}`,
      background: direction === d ? color + '18' : 'white',
      color: direction === d ? color : '#888',
      fontWeight: direction === d ? 700 : 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, fontSize: 15, transition: 'all 0.15s'
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal__header">
          <h3>Movimientos — {a.marca}{a.modelo ? ` ${a.modelo}` : ''}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #eee', padding: '0 20px' }}>
          {(['nuevo', 'historial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 700 : 400, fontSize: 14,
              color: tab === t ? '#1D6B42' : '#888',
              borderBottom: tab === t ? '2px solid #1D6B42' : '2px solid transparent',
              marginBottom: -2
            }}>
              {t === 'nuevo' ? '➕ Nuevo Movimiento' : '📋 Historial'}
            </button>
          ))}
        </div>

        <div className="modal__body">
          {tab === 'nuevo' ? (
            <>
              {/* Stock actual */}
              <div style={{ background: '#f0f7f4', borderRadius: 10, padding: '12px 16px',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>🔧</span>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Stock actual</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1D6B42' }}>{stockActual}</div>
                </div>
              </div>

              {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {dirBtn('IN',  'Entrada', '#0d6efd', <FaArrowDown />)}
                {dirBtn('OUT', 'Salida',  '#dc3545', <FaArrowUp />)}
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div style={{
                  background: direction === 'IN' ? '#e8f0fe' : '#fde8e8',
                  borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13,
                  color: direction === 'IN' ? '#1a56db' : '#dc3545', fontWeight: 600
                }}>
                  Stock resultante:{' '}
                  {direction === 'IN' ? stockActual + parseInt(quantity) : stockActual - parseInt(quantity)}
                </div>
              )}

              <div className="form-group">
                <label>Cantidad *</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                  min="1" max={direction === 'OUT' ? stockActual : undefined}
                  placeholder="0" style={{ fontSize: 18, fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea value={observations} onChange={e => setObs(e.target.value)}
                  placeholder="Motivo del movimiento, detalles adicionales..."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>
            </>
          ) : (
            /* Historial con impresión */
            <div>
              {loadingHist ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Cargando historial...</div>
              ) : movements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin movimientos registrados</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                  {movements.map(m => {
                    const isIn = m.action === 'ASSET_MOVEMENT_IN';
                    const nv = m.newValue as any;
                    const color = isIn ? '#0d6efd' : '#dc3545';
                    return (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px', borderRadius: 10,
                        background: isIn ? '#f0f6ff' : '#fff5f5',
                        border: `1px solid ${isIn ? '#b8d0f5' : '#f5c6cb'}`
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'white', fontSize: 16
                        }}>
                          {isIn ? <FaArrowDown /> : <FaArrowUp />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color, fontSize: 14 }}>
                            {isIn ? 'Entrada' : 'Salida'} — {nv?.quantity ?? '?'} unidades
                          </div>
                          {nv?.observations && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{nv.observations}</div>
                          )}
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                            {new Date(m.createdAt).toLocaleString('es-MX')}
                            {(nv?.stockActual != null) && (
                              <span style={{ marginLeft: 8 }}>· Stock: {(m.oldValue as any)?.stockActual ?? '?'} → {nv.stockActual}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm"
                          style={{ background: color, color: 'white', padding: '5px 10px', flexShrink: 0 }}
                          title="Imprimir hoja"
                          onClick={() => handlePrint(m)}
                        >
                          <FaPrint />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          {tab === 'nuevo' && (
            <button className="btn"
              style={{ background: direction === 'IN' ? '#0d6efd' : '#dc3545', color: 'white' }}
              onClick={handleSubmit} disabled={saving || !quantity}>
              {saving ? 'Registrando...' : direction === 'IN' ? '↓ Registrar Entrada' : '↑ Registrar Salida'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
