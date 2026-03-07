import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';
import logoImg from '../../assets/logo.png';
import troncoImg from '../../assets/troncos.png';

export default function Login() {
  const { login, selectEnvironment } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const envs = await login({ email, password });
      if (envs.length === 0) {
        setError('No tienes entornos asignados. Contacta al administrador.');
        return;
      }
      if (envs.length === 1) {
        await selectEnvironment(envs[0]);
        navigate('/');
      } else {
        navigate('/select-environment');
      }
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-content">
       
          <img src={logoImg} alt="Logo AU DAM" className="login-logo" />
          <form onSubmit={handleSubmit} className="login-form">
            <label>Correo Electrónico</label>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label>Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
      <div className="login-right">
        <img src={troncoImg} alt="Troncos" className="login-bg" />
      </div>
    </div>
  );
}
