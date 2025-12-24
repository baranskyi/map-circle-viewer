import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm hidden sm:inline">{user.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              {user.email}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Выход...' : 'Выйти'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
