import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserEnvironment } from '../../types';
import './SelectEnvironment.css';

export default function SelectEnvironment() {
  const { environments, selectEnvironment } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelect = async (env: UserEnvironment) => {
    setLoading(env.environmentId);
    setError('');
    try {
      await selectEnvironment(env);
      navigate('/');
    } catch {
      setError('No se pudo seleccionar el entorno. Intenta de nuevo.');
      setLoading(null);
    }
  };

  return (
    <div className="select-env-container">
      <div className="select-env-card">
        <img src="/src/assets/logo.png" alt="Logo" className="select-env-logo" />
        <h2>Selecciona un Entorno</h2>
        <p>Elige el entorno de trabajo para continuar</p>
        {error && <div style={{ color: '#dc3545', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div className="env-list">
          {environments.map((env) => (
            <button
              key={env.environmentId}
              className="env-item"
              onClick={() => handleSelect(env)}
              disabled={loading === env.environmentId}
            >
              <div className="env-item__name">
                {loading === env.environmentId ? 'Conectando...' : (env.environment?.name || env.environmentId)}
              </div>
              <div className="env-item__role">{env.role}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
