import { useState } from 'react';
import { useAuth } from './AuthContext';
import { signOutUser } from '../firebase';
import { LogOut } from 'react-feather';

export default function UserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.email}
        </p>
      </div>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        title="Sign out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
