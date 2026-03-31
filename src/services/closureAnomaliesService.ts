/*
-- ===================================================
-- Código             : src/services/closureAnomaliesService.ts
-- Versão             : 1.0.0
-- Data/Hora          : 2026-03-31 America/Sao_Paulo
-- Autor              : FL / Claude
-- Objetivo           : Busca anomalias de fechamento via RPC get_closure_anomalies.
-- ===================================================
*/

import { supabase } from '@/lib/supabaseClient';

export interface ClosureAnomaly {
  anomaly_type: 'duplicate' | 'high_loss' | 'concentration' | 'last_day_spike';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  r_amount: number;
  company_name: string | null;
  owner_name: string | null;
  detail: Record<string, unknown>;
}

export async function fetchClosureAnomalies(
  tenantId: string,
  year: number,
  month: number
): Promise<ClosureAnomaly[]> {
  const { data, error } = await supabase.rpc('get_closure_anomalies', {
    p_tenant_id: tenantId,
    p_year: year,
    p_month: month,
  });

  if (error) throw new Error(error.message ?? 'Falha ao buscar anomalias de fechamento.');
  if (!Array.isArray(data)) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    anomaly_type: r.anomaly_type as ClosureAnomaly['anomaly_type'],
    severity:     r.severity as ClosureAnomaly['severity'],
    title:        String(r.title ?? ''),
    description:  String(r.description ?? ''),
    r_amount:     r.r_amount != null ? parseFloat(String(r.r_amount)) : 0,
    company_name: r.company_name != null ? String(r.company_name) : null,
    owner_name:   r.owner_name  != null ? String(r.owner_name)  : null,
    detail:       (r.detail as Record<string, unknown>) ?? {},
  }));
}
