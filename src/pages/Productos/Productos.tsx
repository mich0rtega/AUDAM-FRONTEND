import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { productsService } from '../../services/productsService';
import { Product } from '../../types';
import { FaPlus, FaEdit, FaToggleOn, FaToggleOff, FaSearch, FaEye } from 'react-icons/fa';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';
import ProductDetailModal from './ProductDetailModal';

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    try {
      const data = await productsService.list();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let list = products;
    if (!showAll) list = list.filter(p => p.isActive);
    setFiltered(list.filter(p =>
      p.marca.toLowerCase().includes(q) ||
      (p.modelo || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    ));
  }, [search, products, showAll]);

  const handleEdit = (p: Product) => { setSelected(p); setShowModal(true); };
  const handleNew = () => { setSelected(null); setShowModal(true); };
  const handleMovement = (p: Product) => { setSelected(p); setShowMovModal(true); };
  const handleDetail = (p: Product) => { setSelected(p); setShowDetailModal(true); };

  const toggleActive = async (p: Product) => {
    try {
      if (p.isActive) await productsService.disable(p.id);
      else await productsService.enable(p.id);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al cambiar estado');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div />
        <button className="btn btn-primary" onClick={handleNew}>
          <FaPlus /> Nuevo Producto
        </button>
      </div>

      <div className="search-bar">
        <FaSearch style={{ color: '#aaa' }} />
        <input
          placeholder="Buscar por marca, modelo o SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Cargando productos...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Marca / Modelo</th>
                <th>Tipo</th>
                <th>SKU</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Sin resultados</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  {/* Miniatura */}
                  <td style={{ padding: '6px 8px' }}>
                    {(p as any).imagenUrl ? (
                      <img
                        src={(p as any).imagenUrl}
                        alt={p.marca}
                        onClick={() => handleDetail(p)}
                        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6,
                          border: '1px solid #ddd', cursor: 'pointer', display: 'block' }}
                        title="Ver detalle"
                      />
                    ) : (
                      <div
                        onClick={() => handleDetail(p)}
                        style={{ width: 36, height: 36, borderRadius: 6, background: '#f0f0f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: '#ccc', cursor: 'pointer', border: '1px solid #e0e0e0' }}
                        title="Ver detalle"
                      >📦</div>
                    )}
                  </td>
                  <td>
                    <strong>{p.marca}</strong>
                    {p.modelo && <span style={{ color: '#888', marginLeft: 4 }}>- {p.modelo}</span>}
                    {p.especificacion && <div style={{ fontSize: 11, color: '#aaa' }}>{p.especificacion}</div>}
                  </td>
                  <td>{(p as any).type?.name || '—'}</td>
                  <td>{p.sku || '—'}</td>
                  <td>{p.unit || '—'}</td>
                  <td>
                    <span className={`badge ${p.stockActual <= 5 ? 'badge-red' : p.stockActual <= 20 ? 'badge-yellow' : 'badge-green'}`}>
                      {p.stockActual}
                    </span>
                  </td>
                  <td>${Number(p.precioUnitario).toFixed(2)}</td>
                  <td>{(p as any).proveedor?.nombre || '—'}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-outline btn-sm" onClick={() => handleDetail(p)} title="Ver detalle">
                        <FaEye />
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)} title="Editar">
                        <FaEdit />
                      </button>
                      <button className="btn btn-sm" style={{ background: '#0d6efd', color: 'white' }}
                        onClick={() => handleMovement(p)} title="Registrar movimiento">±</button>
                      <button
                        className={`btn btn-sm ${p.isActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleActive(p)}
                        title={p.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {p.isActive ? <FaToggleOff /> : <FaToggleOn />}
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
        <ProductModal
          product={selected}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
      {showMovModal && selected && (
        <MovementModal
          product={selected}
          onClose={() => setShowMovModal(false)}
          onSave={() => { setShowMovModal(false); load(); }}
        />
      )}
      {showDetailModal && selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => { setShowDetailModal(false); setShowModal(true); }}
        />
      )}
    </Layout>
  );
}
