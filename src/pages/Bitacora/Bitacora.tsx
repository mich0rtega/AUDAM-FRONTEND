import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { auditService } from '../../services/auditService';
import { FaSearch } from 'react-icons/fa';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  PRODUCT_CREATED:        { label: 'Producto creado',        color: '#1D6B42' },
  PRODUCT_UPDATED:        { label: 'Producto editado',        color: '#0d6efd' },
  PRODUCT_DISABLED:       { label: 'Producto desactivado',   color: '#dc3545' },
  PRODUCT_ENABLED:        { label: 'Producto activado',      color: '#1D6B42' },
  PRODUCT_PRICE_CHANGED:  { label: 'Precio actualizado',     color: '#7B4B27' },
  PRODUCT_STOCK_ADJUSTED: { label: 'Stock ajustado',         color: '#6f42c1' },
  PRODUCT_MOVEMENT_IN:    { label: 'Entrada de stock',       color: '#1D6B42' },
  PRODUCT_MOVEMENT_OUT:   { label: 'Salida de stock',        color: '#dc3545' },
  MOVEMENT_CREATED:       { label: 'Movimiento creado',      color: '#0d6efd' },
  USER_CREATED:           { label: 'Usuario creado',         color: '#1D6B42' },
  USER_DISABLED:          { label: 'Usuario desactivado',    color: '#dc3545' },
  USER_ENABLED:           { label: 'Usuario activado',       color: '#1D6B42' },
  ROLE_ASSIGNED:          { label: 'Rol asignado',           color: '#7B4B27' },
  ROLE_CHANGED:           { label: 'Rol cambiado',           color: '#ffc107' },
  PRODUCTSTATUS_ENABLED:  { label: 'Estado habilitado',      color: '#1D6B42' },
  PRODUCTSTATUS_DISABLED: { label: 'Estado deshabilitado',   color: '#dc3545' },
};

const MODULE_LABELS: Record<string, string> = {
  Product: 'Productos',
  Movement: 'Movimientos',
  User: 'Usuarios',
  UserEnvironment: 'Entornos',
  ProductType: 'Catálogo',
  ProductStatus: 'Catálogo',
  MovementType: 'Catálogo',
  AssetCategory: 'Catálogo',
  Provider: 'Proveedores',
};

export default function Bitacora() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    auditService.list()
      .then(data => { setLogs(data); setFiltered(data); })
      .catch(() => setError('No se pudo cargar la bitácora'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(logs.filter(l =>
      (l.actor?.email || '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.targetType || '').toLowerCase().includes(q) ||
      (ACTION_LABELS[l.action]?.label || '').toLowerCase().includes(q)
    ));
  }, [search, logs]);

  return (
    <Layout>
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <FaSearch style={{ color: '#aaa' }} />
        <input
          placeholder="Buscar por usuario, acción o módulo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>
          {filtered.length} registros
        </span>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Cargando bitácora...</div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>Sin registros</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Detalle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const actionInfo = ACTION_LABELS[log.action];
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#666' }}>
                      {new Date(log.createdAt).toLocaleString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontSize: 13 }}>{log.actor?.email || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: (actionInfo?.color || '#888') + '18',
                        color: actionInfo?.color || '#888',
                        border: `1px solid ${(actionInfo?.color || '#888')}40`
                      }}>
                        {actionInfo?.label || log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#555' }}>
                      {MODULE_LABELS[log.targetType] || log.targetType}
                    </td>
                    <td style={{ fontSize: 12, color: '#888', maxWidth: 240 }}>
                      {/* Muestra un resumen del newValue si existe */}
                      {log.newValue ? (
                        <span style={{ fontFamily: 'monospace' }}>
                          {Object.entries(log.newValue as object)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedLog(log)}
                      >Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}</h3>
              <button className="modal__close" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20, fontSize: 13 }}>
                <div><span style={{ color: '#aaa' }}>Usuario:</span><br /><strong>{selectedLog.actor?.email || '—'}</strong></div>
                <div><span style={{ color: '#aaa' }}>Módulo:</span><br /><strong>{MODULE_LABELS[selectedLog.targetType] || selectedLog.targetType}</strong></div>
                <div><span style={{ color: '#aaa' }}>Fecha:</span><br /><strong>{new Date(selectedLog.createdAt).toLocaleString('es-MX')}</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {selectedLog.oldValue ? (
                  <div>
                    <div style={{ fontWeight: 700, color: '#dc3545', marginBottom: 8, fontSize: 13 }}>← Antes</div>
                    <pre style={{
                      background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 8,
                      padding: 12, fontSize: 12, overflow: 'auto', margin: 0,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                    }}>{JSON.stringify(selectedLog.oldValue, null, 2)}</pre>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, color: '#dc3545', marginBottom: 8, fontSize: 13 }}>← Antes</div>
                    <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8,
                      padding: 16, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                      Sin datos previos registrados
                    </div>
                  </div>
                )}
                {selectedLog.newValue ? (
                  <div>
                    <div style={{ fontWeight: 700, color: '#1D6B42', marginBottom: 8, fontSize: 13 }}>→ Después</div>
                    <pre style={{
                      background: '#f0fff4', border: '1px solid #c3e6cb', borderRadius: 8,
                      padding: 12, fontSize: 12, overflow: 'auto', margin: 0,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                    }}>{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, color: '#1D6B42', marginBottom: 8, fontSize: 13 }}>→ Después</div>
                    <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8,
                      padding: 16, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                      Sin datos nuevos registrados
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn-outline" onClick={() => setSelectedLog(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
