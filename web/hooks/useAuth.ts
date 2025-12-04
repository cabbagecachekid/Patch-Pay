import { useState, useEffect } from 'react';

interface User {
  email: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('patchpay_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = (email: string) => {
    const userData: User = {
      email,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('patchpay_user', JSON.stringify(userData));
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem('patchpay_user');
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}
