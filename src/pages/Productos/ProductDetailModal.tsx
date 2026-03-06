import React from 'react';
import { Product } from '../../types';
import { FaEdit } from 'react-icons/fa';

interface Props {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetailModal({ product, onClose, onEdit }: Props) {
  const p = product as any;

  const fields = [
    { label: 'Marca',          value: p.marca },
    { label: 'Modelo',         value: p.modelo || '—' },
    { label: 'SKU',            value: p.sku || '—' },
    { label: 'Unidad',         value: p.unit || '—' },
    { label: 'Tipo',           value: p.type?.name || '—' },
    { label: 'Estado',         value: p.status?.name || '—' },
    { label: 'Proveedor',      value: p.proveedor?.nombre || '—' },
    { label: 'Precio unitario',value: `$${Number(p.precioUnitario).toFixed(2)}` },
    { label: 'Stock actual',   value: p.stockActual },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg">
        <div className="modal__header">
          <h3>Detalle del Producto</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* Imagen */}
            <div style={{ flexShrink: 0 }}>
              {p.imagenUrl ? (
                <img
                  src={p.imagenUrl}
                  alt={p.marca}
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 12,
                    border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: 12, background: '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52, color: '#ccc', border: '1px solid #e0e0e0' }}>
                  📦
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>
                  {p.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Campos */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px', color: '#1D6B42', fontSize: 20 }}>
                {p.marca}{p.modelo ? ` ${p.modelo}` : ''}
              </h2>
              {p.especificacion && (
                <p style={{ color: '#888', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                  {p.especificacion}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {fields.map(f => (
                  <div key={f.label} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase',
                      letterSpacing: '0.5px', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>
                      {f.label === 'Stock actual' ? (
                        <span className={`badge ${Number(f.value) <= 5 ? 'badge-red' : Number(f.value) <= 20 ? 'badge-yellow' : 'badge-green'}`}>
                          {f.value} {p.unit || 'pzas'}
                        </span>
                      ) : f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={onEdit}>
            <FaEdit style={{ marginRight: 6 }} />Editar Producto
          </button>
        </div>
      </div>
    </div>
  );
}
