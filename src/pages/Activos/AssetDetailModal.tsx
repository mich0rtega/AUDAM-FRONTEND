import React from 'react';
import { Asset } from '../../types';
import { FaEdit } from 'react-icons/fa';

interface Props {
  asset: Asset;
  onClose: () => void;
  onEdit: () => void;
}

export default function AssetDetailModal({ asset, onClose, onEdit }: Props) {
  const a = asset as any;


  const responsableDisplay = a.responsableNombre
    ? a.responsableNombre
    : (a.responsable?.email || '—');

  const fields = [
    { label: 'Marca',            value: a.marca },
    { label: 'Modelo',           value: a.modelo || '—' },
    { label: 'No. de Serie',     value: a.numeroSerie || '—' },
    { label: 'Categoría',        value: a.category?.name || '—' },
    { label: 'Estado',           value: a.status?.name || '—' },
    { label: 'Responsable',      value: responsableDisplay },
    { label: 'Centro de Costo',  value: a.centroCosto || '—' },
    { label: 'Ubicación',        value: a.ubicacion || '—' },
    { label: 'Cantidad',         value: a.stockActual ?? '—' },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg">
        <div className="modal__header">
          <h3>Detalle del Activo</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Imagen */}
            <div style={{ flexShrink: 0 }}>
              {a.imagenUrl ? (
                <img src={a.imagenUrl} alt={a.marca}
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 12,
                    border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: 12, background: '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52, color: '#ccc', border: '1px solid #e0e0e0' }}>🔧</div>
              )}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span className="badge badge-blue">{a.status?.name || '—'}</span>
              </div>
            </div>

            {/* Campos */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px', color: '#1D6B42', fontSize: 20 }}>
                {a.marca}{a.modelo ? ` ${a.modelo}` : ''}
              </h2>
              {a.numeroSerie && (
                <p style={{ color: '#888', fontSize: 13, margin: '0 0 16px' }}>S/N: {a.numeroSerie}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {fields.map(f => (
                  <div key={f.label} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase',
                      letterSpacing: '0.5px', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={onEdit}>
            <FaEdit style={{ marginRight: 6 }} />Editar Activo
          </button>
        </div>
      </div>
    </div>
  );
}
