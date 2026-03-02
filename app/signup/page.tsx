'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sign up is now handled on the same page as login (toggle pill)
export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
