  import React, { useState } from 'react';
  import { Link } from 'react-router-dom';
  import { passwordService } from '../../services/passwordService';
  import { Mail } from 'lucide-react';
  import './ForgotPassword.css';

  const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await passwordService.requestPasswordReset({ email });
        setMessage(response.message);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al procesar la solicitud');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <h2 className="title"> Recuperación de Contraseña</h2>
          <p className="subtitle">Por favor ingresa tu correo electrónico</p>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <label htmlFor="email" className="form-label">Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Please enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="send-btn" disabled={loading}>
              {loading ? 'Enviando...' : 'Send Email'}
            </button>

            <div className="back-link">
              <Link to="/login">← Volver al inicio de sesión</Link>
            </div>
          </form>

          <div className="admin-contact">
            <h4>Contacto del Administrador</h4>
            <p>Si tienes problemas, contacta directamente al administrador:</p>
            <ul>
              <li><strong>Email:</strong> admin@audam.com</li>
              <li><strong>Teléfono:</strong> +123 456 7890</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  export default ForgotPassword;
