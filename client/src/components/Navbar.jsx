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
              <span className="nav-avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="nav-user-meta">
                <span className="nav-user-name">{user.name}</span>
                <span className={`badge badge-${isAdmin ? 'admin' : 'customer'}`}>
                  {isAdmin ? 'Admin' : 'Customer'}
                </span>
              </span>
            </span>
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
