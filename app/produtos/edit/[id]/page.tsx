'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditProductRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    // Redireciona para /produtos/new?id=xxx
    router.replace(`/produtos/new?id=${id}`);
  }, [id, router]);

  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="text-xl text-gray-600 dark:text-gray-400">Redirecionando...</div>
    </div>
  );
}
