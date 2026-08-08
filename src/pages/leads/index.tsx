
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LeadsIndex() {
  const router = useRouter();

  useEffect(() => {
    const savedView = typeof window !== 'undefined'
      ? localStorage.getItem('leadsView') || 'list'
      : 'list';
    router.replace(`/leads/${savedView}`);
  }, []);

  return null;
}