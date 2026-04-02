import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

export function useSysExport(): void {
  const { user } = useAuth();
  const isMasterRef = useRef(false);

  useEffect(() => {
    if (!user) {
      isMasterRef.current = false;
      return;
    }
    supabase
      .from('profiles')
      .select('is_master_admin')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => {
        isMasterRef.current = data?.is_master_admin === true;
      });
  }, [user]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key === 'X')) return;

      if (isMasterRef.current !== true) return;

      const { data, error } = await supabase.rpc('get_activity_logs_full');

      if (error) {
        console.error(error);
        alert('Erro ao exportar logs');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data ?? []);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'activity_logs');

      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `activity_logs_${today}.xlsx`);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
