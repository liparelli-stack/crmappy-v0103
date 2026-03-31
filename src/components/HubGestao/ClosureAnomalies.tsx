/*
-- ===================================================
-- Código             : src/components/HubGestao/ClosureAnomalies.tsx
-- Versão             : 1.0.0
-- Data/Hora          : 2026-03-31 America/Sao_Paulo
-- Autor              : FL / Claude
-- Objetivo           : Quadro de anomalias do fechamento mensal.
--                      Retorna null se loading ou sem anomalias.
-- ===================================================
*/

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchClosureAnomalies, ClosureAnomaly } from '@/services/closureAnomaliesService';

/* ============================================================
   Props
   ============================================================ */
interface ClosureAnomaliesProps {
  tenantId: string;
  year: number;
  month: number;
}

/* ============================================================
   Ícone de severidade
   ============================================================ */
function SeverityIcon({ severity }: { severity: ClosureAnomaly['severity'] }) {
  if (severity === 'critical') {
    return <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f06060' }} />;
  }
  return <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />;
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const ClosureAnomalies: React.FC<ClosureAnomaliesProps> = ({ tenantId, year, month }) => {
  const { data, isLoading } = useQuery<ClosureAnomaly[]>({
    queryKey: ['closure-anomalies', tenantId, year, month],
    queryFn: () => fetchClosureAnomalies(tenantId, year, month),
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId && year > 0 && month > 0,
  });

  if (isLoading || !data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="bg-amber-50 dark:bg-dark-s1 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 space-y-2">
      {/* Cabeçalho */}
      <div className="mb-1">
        <p className="text-sm font-medium text-light-t1 dark:text-dark-t1">
          ⚠️ Alertas do Fechamento
        </p>
        <p className="text-xs text-light-t3 dark:text-dark-t3 mt-0.5">
          {sorted.length} anomalia{sorted.length !== 1 ? 's' : ''} detectada{sorted.length !== 1 ? 's' : ''} — verifique antes de fechar o mês
        </p>
      </div>

      {/* Lista de anomalias */}
      {sorted.map((anomaly, idx) => (
        <div key={idx} className="flex gap-3 items-start">
          <SeverityIcon severity={anomaly.severity} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-light-t1 dark:text-dark-t1">
              {anomaly.title}
            </p>
            <p className="text-xs text-light-t2 dark:text-dark-t2 mt-0.5">
              {anomaly.description}
            </p>
            {anomaly.owner_name && (
              <span className="text-xs bg-light-s2 dark:bg-dark-s2 px-2 py-0.5 rounded mt-1 inline-block text-light-t2 dark:text-dark-t2">
                Vendedor: {anomaly.owner_name}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClosureAnomalies;
