import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(form.email, form.password);
  };

  return (
    <div className="auth-page">
      <Card title="Welcome back" className="auth-card">
        <p className="muted auth-subtitle">Log in to manage your table reservations.</p>
        <Alert>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" disabled={loading} className="btn-block">
            {loading ? 'Logging in…' : 'Login'}
          </Button>
        </form>
        <p className="muted auth-switch">
          No account? <Link to="/register">Create one</Link>
        </p>
      </Card>
    </div>
  );
}
