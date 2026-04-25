import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-lg mb-3">
              <Building2 className="w-6 h-6" />
              Квартал
            </Link>
            <p className="text-sm text-gray-500">
              Учебный pet-проект. Поиск и объявления о продаже и аренде недвижимости.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Поиск</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/listings?dealType=sale" className="hover:text-primary-600">Купить квартиру</Link></li>
              <li><Link to="/listings?dealType=rent" className="hover:text-primary-600">Снять квартиру</Link></li>
              <li><Link to="/listings?propertyType=newbuilding" className="hover:text-primary-600">Новостройки</Link></li>
              <li><Link to="/listings?propertyType=studio" className="hover:text-primary-600">Студии</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Кабинет</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/profile" className="hover:text-primary-600">Мой профиль</Link></li>
              <li><Link to="/favorites" className="hover:text-primary-600">Избранное</Link></li>
              <li><Link to="/login" className="hover:text-primary-600">Войти</Link></li>
              <li><Link to="/register" className="hover:text-primary-600">Регистрация</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Города</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/listings?city=Москва" className="hover:text-primary-600">Москва</Link></li>
              <li><Link to="/listings?city=Санкт-Петербург" className="hover:text-primary-600">Санкт-Петербург</Link></li>
              <li><Link to="/listings?city=Казань" className="hover:text-primary-600">Казань</Link></li>
              <li><Link to="/listings?city=Новосибирск" className="hover:text-primary-600">Новосибирск</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Квартал — учебный pet-проект. Не является коммерческим сервисом.
        </div>
      </div>
    </footer>
  );
}
