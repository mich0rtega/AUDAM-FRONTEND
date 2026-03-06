import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1D6B42', '#7B4B27', '#0d6efd', '#ffc107', '#dc3545', '#6f42c1'];

export default function Dashboard() {
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.getOverview()
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading">Cargando dashboard...</div></Layout>;
  if (error) return <Layout><div className="error-msg">{error}</div></Layout>;
  if (!data) return <Layout><div className="empty-state"><p>Sin datos</p></div></Layout>;

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (data.role === 'ADMIN') {
    const { movimientosPorTipo, productosBajoStock, consumoPorCentroCosto,
            entradasPorOrigen, salidasPorDestino, historialRequisiciones } = data;

    const entradas = movimientosPorTipo?.find((m: any) => m.direction === 'IN');
    const salidas  = movimientosPorTipo?.find((m: any) => m.direction === 'OUT');

    return (
      <Layout>
        {/* KPI Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Entradas (unidades)</h4>
            <div className="stat-value">{entradas?.quantity ?? 0}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{entradas?.movimientos ?? 0} movimientos</div>
          </div>
          <div className="stat-card stat-card--brown">
            <h4>Salidas (unidades)</h4>
            <div className="stat-value" style={{ color: '#7B4B27' }}>{salidas?.quantity ?? 0}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{salidas?.movimientos ?? 0} movimientos</div>
          </div>
          <div className="stat-card stat-card--red">
            <h4>Stock Crítico (≤10)</h4>
            <div className="stat-value" style={{ color: '#dc3545' }}>{productosBajoStock?.length ?? 0}</div>
          </div>
          <div className="stat-card stat-card--blue">
            <h4>Requisiciones</h4>
            <div className="stat-value" style={{ color: '#0d6efd' }}>{historialRequisiciones?.length ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Consumo por Centro de Costo */}
          {consumoPorCentroCosto?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 16, color: '#7B4B27', fontWeight: 700 }}>Consumo por Centro de Costo</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={consumoPorCentroCosto} margin={{ left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="centroCosto" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#7B4B27" radius={[4, 4, 0, 0]} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Entradas por Origen */}
          {entradasPorOrigen?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 16, color: '#7B4B27', fontWeight: 700 }}>Entradas por Tipo</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={entradasPorOrigen} dataKey="quantity" nameKey="key"
                    cx="50%" cy="50%" outerRadius={80} label={({ key, quantity }) => `${key}: ${quantity}`}>
                    {entradasPorOrigen.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Salidas por Destino */}
          {salidasPorDestino?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 16, color: '#7B4B27', fontWeight: 700 }}>Salidas por Destino</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salidasPorDestino} margin={{ left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="key" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#1D6B42" radius={[4, 4, 0, 0]} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Productos bajo stock */}
          {productosBajoStock?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 12, color: '#dc3545', fontWeight: 700 }}>⚠ Productos con Stock Crítico</h4>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Unidad</th></tr></thead>
                  <tbody>
                    {productosBajoStock.map((p: any) => (
                      <tr key={p.id}>
                        <td><strong>{p.marca}</strong>{p.modelo ? ` ${p.modelo}` : ''}</td>
                        <td>{p.sku || '—'}</td>
                        <td><span className={`badge ${p.stockActual <= 5 ? 'badge-red' : 'badge-yellow'}`}>{p.stockActual}</span></td>
                        <td>{p.unit || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Historial Requisiciones */}
        {historialRequisiciones?.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 12, color: '#7B4B27', fontWeight: 700 }}>Últimas Requisiciones</h4>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Folio</th><th>Solicitante</th><th>Destino</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {historialRequisiciones.slice(0, 10).map((r: any) => (
                    <tr key={r.id}>
                      <td><strong>{r.folio}</strong></td>
                      <td>{r.solicitorName}</td>
                      <td>{r.destination?.name || '—'}</td>
                      <td>
                        <span className={`badge ${
                          r.status?.name?.toLowerCase().includes('pend') ? 'badge-yellow' :
                          r.status?.name?.toLowerCase().includes('autori') ? 'badge-green' :
                          r.status?.name?.toLowerCase().includes('rechaz') ? 'badge-red' : 'badge-gray'
                        }`}>{r.status?.name || '—'}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleDateString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // ── ALMACEN ────────────────────────────────────────────────────────────────
  if (data.role === 'ALMACEN') {
    const { movimientosDiarios, productosBajoStock, productosConMasMovimientos } = data;
    return (
      <Layout>
        <div className="stats-grid">
          <div className="stat-card stat-card--red">
            <h4>Stock Crítico</h4>
            <div className="stat-value" style={{ color: '#dc3545' }}>{productosBajoStock?.length ?? 0}</div>
          </div>
          <div className="stat-card">
            <h4>Días con Movimientos</h4>
            <div className="stat-value">{movimientosDiarios?.length ?? 0}</div>
          </div>
        </div>
        {movimientosDiarios?.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 16, color: '#7B4B27', fontWeight: 700 }}>Movimientos Diarios (últimos 30 días)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...movimientosDiarios].reverse()} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('es-MX')} />
                <Legend />
                <Bar dataKey="entradas" fill="#1D6B42" name="Entradas" radius={[3, 3, 0, 0]} />
                <Bar dataKey="salidas"  fill="#7B4B27" name="Salidas"  radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {productosBajoStock?.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 12, color: '#dc3545', fontWeight: 700 }}>⚠ Stock Crítico</h4>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Producto</th><th>SKU</th><th>Stock</th></tr></thead>
                <tbody>
                  {productosBajoStock.map((p: any) => (
                    <tr key={p.id}>
                      <td><strong>{p.marca}</strong>{p.modelo ? ` ${p.modelo}` : ''}</td>
                      <td>{p.sku || '—'}</td>
                      <td><span className="badge badge-red">{p.stockActual}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // ── AUTORIZADOR ────────────────────────────────────────────────────────────
  if (data.role === 'AUTORIZADOR') {
    const { requisicionesPendientes, consumoPorCentroCosto } = data;
    return (
      <Layout>
        <div className="stats-grid">
          <div className="stat-card stat-card--brown">
            <h4>Requisiciones Pendientes</h4>
            <div className="stat-value">{requisicionesPendientes?.length ?? 0}</div>
          </div>
        </div>
        {requisicionesPendientes?.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 12, color: '#7B4B27', fontWeight: 700 }}>Requisiciones Pendientes de Autorización</h4>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Folio</th><th>Solicitante</th><th>Destino</th><th>Fecha</th></tr></thead>
                <tbody>
                  {requisicionesPendientes.map((r: any) => (
                    <tr key={r.id}>
                      <td><strong>{r.folio}</strong></td>
                      <td>{r.solicitorName}</td>
                      <td>{r.destination?.name || '—'}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // ── COMPRAS / fallback ─────────────────────────────────────────────────────
  const { entradasYSalidasConsumidasPorMes } = data;
  return (
    <Layout>
      {entradasYSalidasConsumidasPorMes?.length > 0 ? (
        <div className="card">
          <h4 style={{ marginBottom: 16, color: '#7B4B27', fontWeight: 700 }}>Entradas y Salidas Mensuales</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...entradasYSalidasConsumidasPorMes].reverse()} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })} />
              <Legend />
              <Bar dataKey="entradas" fill="#1D6B42" name="Entradas" radius={[3, 3, 0, 0]} />
              <Bar dataKey="salidas"  fill="#7B4B27" name="Salidas"  radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state"><p>Sin datos para tu rol</p></div>
      )}
    </Layout>
  );
}
