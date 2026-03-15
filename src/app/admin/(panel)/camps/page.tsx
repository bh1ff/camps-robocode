'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CampsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/seasons'); }, [router]);
  return null;
}
