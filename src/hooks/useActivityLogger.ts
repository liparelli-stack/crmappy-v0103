import { useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useActivityLogger() {
  const sessionTabId = useRef<string | null>(null);
  if (sessionTabId.current === null) {
    let tabId = sessionStorage.getItem('tab_id');
    if (!tabId) {
      tabId = crypto.randomUUID();
      sessionStorage.setItem('tab_id', tabId);
    }
    sessionTabId.current = tabId;
  }

  function logActivity(
    eventType: string,
    page?: string | null,
    metadata?: Record<string, unknown>
  ) {
    supabase
      .rpc('log_activity', {
        p_event_type: eventType,
        p_page: page ?? null,
        p_session_tab_id: sessionTabId.current!,
        p_metadata: metadata ?? {},
      })
      .then()
      .catch(console.error);
  }

  function logLogin() {
    logActivity('login');
  }

  function logLogout() {
    logActivity('logout');
  }

  return { logActivity, logLogin, logLogout };
}
