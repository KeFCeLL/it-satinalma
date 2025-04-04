'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">IT Satınalma Sistemi</h1>
        </div>
        
        {session?.user && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {session.user.name} ({session.user.email})
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 