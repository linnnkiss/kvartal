import { Link, useNavigate } from 'react-router-dom';
import { Building2, Heart, User, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setMobileOpen(false);
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
            <Building2 className="w-7 h-7" />
            <span>Квартал</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/listings?dealType=sale" className="hover:text-primary-600 transition-colors">Купить</Link>
            <Link to="/listings?dealType=rent" className="hover:text-primary-600 transition-colors">Снять</Link>
            <Link to="/listings?propertyType=newbuilding" className="hover:text-primary-600 transition-colors">Новостройки</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Админ
                  </Link>
                )}
                <Link to="/favorites" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600">
                  <Heart className="w-4 h-4" />
                  Избранное
                </Link>
                <Link to="/profile" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600">
                  <User className="w-4 h-4" />
                  {user.name.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium">Войти</Link>
                <Link to="/register" className="btn-primary text-sm">Регистрация</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
            <Link to="/listings?dealType=sale" className="block px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Купить</Link>
            <Link to="/listings?dealType=rent" className="block px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Снять</Link>
            <Link to="/listings?propertyType=newbuilding" className="block px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Новостройки</Link>
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="block px-2 py-2 text-amber-600" onClick={() => setMobileOpen(false)}>Админ-панель</Link>}
                <Link to="/favorites" className="block px-2 py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Избранное</Link>
                <Link to="/profile" className="block px-2 py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Профиль</Link>
                <button onClick={handleLogout} className="block px-2 py-2 text-red-500 text-left w-full">Выйти</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-2 py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Войти</Link>
                <Link to="/register" className="block px-2 py-2 text-primary-600 font-medium" onClick={() => setMobileOpen(false)}>Регистрация</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
