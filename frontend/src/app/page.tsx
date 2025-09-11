'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Package } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center">
          <Package className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Nexus Retail</h1>
          <p className="text-gray-600">Mobile-first inventory management</p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="text-indigo-600">Loading...</span>
        </div>
      </div>
    </div>
  );
}
