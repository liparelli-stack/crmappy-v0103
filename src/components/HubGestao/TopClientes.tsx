/*
-- ===================================================
-- Código             : src/components/HubGestao/TopClientes.tsx
-- Versão             : 1.0.0
-- Data/Hora          : 2026-03-31 America/Sao_Paulo
-- Autor              : FL / Claude
-- Objetivo           : Tabela Top N clientes por volume de negócios ganhos.
--                      Dados via fetchClientRanking (React Query).
--                      Seletor Top 3 / Top 5 / Top 10 no topo.
-- Observações        :
--   • r_avg_chat_interval_days não está mapeado em ClientRankingRow —
--     coluna ImC exibe "—" até o campo ser adicionado ao serviço/RPC.
-- ===================================================
*/

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { fetchClientRanking, ClientRankingRow } from '@/services/clientRankingService';

/* ============================================================
   Props
   ============================================================ */
interface TopClientesProps {
  tenantId: string;
  authorUserId?: string;
  isAdmin: boolean;
}

/* ============================================================
   Helpers de formatação
   ============================================================ */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function rankLabel(pos: number): string {
  return MEDALS[pos] ? `${MEDALS[pos]} ${pos}` : String(pos);
}

/* ============================================================
   Badge de Score Saúde
   ============================================================ */
function HealthBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? 'bg-success/10 text-success border-success/20'
      : score >= 60
      ? 'bg-warning/10 text-warning border-warning/20'
      : 'bg-danger/10 text-danger border-danger/20';

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-r text-xs font-semibold border',
        style
      )}
    >
      {score}
    </span>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const TopClientes: React.FC<TopClientesProps> = ({ tenantId, authorUserId, isAdmin: _isAdmin }) => {
  const [limit, setLimit] = useState<3 | 5 | 10 | 20 | 'all'>(3);

  const { data, isLoading } = useQuery<ClientRankingRow[]>({
    queryKey: ['clientRanking', tenantId, authorUserId],
    queryFn: () => fetchClientRanking({ tenantId, authorUserId }),
    staleTime: 5 * 60 * 1000,
  });

  const sorted = (data ?? [])
    .slice()
    .sort((a, b) => b.ganha.total - a.ganha.total);
  const rows = limit === 'all' ? sorted : sorted.slice(0, limit);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 rounded-full border-4 border-accent-light border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Seletor Top N ── */}
      <div className="flex items-center gap-2">
        {([3, 5, 10, 20] as const).map((n) => (
          <button
            key={n}
            onClick={() => setLimit(n)}
            className={clsx(
              'px-4 py-1.5 rounded-r text-sm font-semibold transition-colors border',
              limit === n
                ? 'bg-accent-light text-white border-accent-light'
                : 'bg-light-s2 dark:bg-dark-s2 text-light-t2 dark:text-dark-t2 border-light-bmd dark:border-dark-bmd hover:bg-accent-light/10'
            )}
          >
            Top {n}
          </button>
        ))}
        <button
          onClick={() => setLimit('all')}
          className={clsx(
            'px-4 py-1.5 rounded-r text-sm font-semibold transition-colors border',
            limit === 'all'
              ? 'bg-accent-light text-white border-accent-light'
              : 'bg-light-s2 dark:bg-dark-s2 text-light-t2 dark:text-dark-t2 border-light-bmd dark:border-dark-bmd hover:bg-accent-light/10'
          )}
        >
          Todos
        </button>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-light-s1 dark:bg-dark-s1 rounded-xl border border-light-bmd dark:border-dark-bmd shadow-[var(--sh1)] overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-light-t3 dark:text-dark-t3 text-sm">
            Nenhum dado disponível
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light-s1 dark:bg-dark-s1">
              <tr>
                {([
                  { label: '#' },
                  { label: 'Cliente' },
                  { label: 'Vendedor' },
                  { label: 'Ganhos' },
                  { label: 'QTD',   title: 'Quantidade de contratos ganhos' },
                  { label: 'TKM',   title: 'Ticket médio dos orçamentos ganhos' },
                  { label: 'Score', title: 'Score de Saúde do cliente (0–100)' },
                  { label: 'ImC',   title: 'Intervalo médio entre contatos — média de dias entre interações' },
                ] as { label: string; title?: string }[]).map(({ label, title }) => (
                  <th
                    key={label}
                    className={clsx(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-light-t3 dark:text-dark-t3',
                      label === '#' || label === 'QTD' || label === 'Score' || label === 'ImC'
                        ? 'text-center'
                        : 'text-left'
                    )}
                  >
                    {title ? (
                      <span title={title} className="cursor-help border-b border-dashed border-light-t3 dark:border-dark-t3">
                        {label}
                      </span>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const pos = idx + 1;
                return (
                  <tr
                    key={row.companyId}
                    className="border-b border-light-blo dark:border-dark-blo hover:bg-light-s2 dark:hover:bg-dark-s2 transition-colors"
                  >
                    {/* # */}
                    <td className="px-4 py-3 text-center text-xs text-light-t2 dark:text-dark-t2 whitespace-nowrap">
                      {rankLabel(pos)}
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="font-medium text-light-t1 dark:text-dark-t1 truncate block">
                        {row.companyName}
                      </span>
                    </td>

                    {/* Vendedor */}
                    <td className="px-4 py-3 text-xs text-light-t2 dark:text-dark-t2 whitespace-nowrap">
                      {row.ownerName ?? '—'}
                    </td>

                    {/* Ganhos */}
                    <td className="px-4 py-3 font-bold text-light-t1 dark:text-dark-t1 whitespace-nowrap">
                      {formatBRL(row.ganha.total)}
                    </td>

                    {/* QTD */}
                    <td className="px-4 py-3 text-center text-light-t1 dark:text-dark-t1">
                      {row.ganha.qty}
                    </td>

                    {/* TKM */}
                    <td className="px-4 py-3 text-light-t2 dark:text-dark-t2 whitespace-nowrap">
                      {row.ganha.tkm !== null ? formatBRL(row.ganha.tkm) : '—'}
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 text-center">
                      <HealthBadge score={row.healthScore} />
                    </td>

                    {/* ImC */}
                    <td className="px-4 py-3 text-center text-light-t2 dark:text-dark-t2">
                      {row.avgChatIntervalDays != null ? `${row.avgChatIntervalDays}d` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TopClientes;
