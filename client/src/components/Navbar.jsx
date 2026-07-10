import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🍽️ Restaurant Reservations
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user">
              {user.name} {isAdmin && <span className="badge badge-admin">admin</span>}
            </span>
            {isAdmin && <Link to="/admin">Admin</Link>}
            {!isAdmin && <Link to="/">My Reservations</Link>}
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
