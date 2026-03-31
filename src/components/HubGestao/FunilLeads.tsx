/*
-- ===================================================
-- Código             : src/components/HubGestao/FunilLeads.tsx
-- Versão             : 2.0.0
-- Data/Hora          : 2026-03-31 America/Sao_Paulo
-- Autor              : FL / Claude
-- Objetivo           : Funil de conversão Lead → Prospect → Cliente.
--                      Gráfico ECharts tipo funnel (forma fixa) + cards com tooltip explicativo.
-- ===================================================
*/

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { supabase } from '@/lib/supabaseClient';

/* ============================================================
   Props
   ============================================================ */
interface FunilLeadsProps {
  tenantId: string;
}

/* ============================================================
   Fetch
   ============================================================ */
async function fetchFunil(tenantId: string): Promise<{ kind: string }[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('kind')
    .eq('tenant_id', tenantId);
  if (error) throw error;
  return data ?? [];
}

/* ============================================================
   Textos dos tooltips
   ============================================================ */
const TOOLTIP_CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  lead: {
    title: 'O que é um Lead?',
    body: (
      <>
        <p>Um lead é uma empresa que demonstrou algum interesse inicial no seu produto ou serviço, mas ainda não foi qualificada comercialmente.</p>
        <p className="mt-2">Exemplo: uma clínica que baixou um material, respondeu uma campanha ou foi prospectada pela equipe — ainda sem contato comercial ativo.</p>
        <p className="mt-2 text-xs font-medium text-[#3b68f5]">Avanço para Prospect: quando há contato estabelecido e interesse confirmado em uma solução específica.</p>
      </>
    ),
  },
  prospect: {
    title: 'O que é um Prospect?',
    body: (
      <>
        <p>Um prospect é uma empresa qualificada — há compatibilidade com o produto, capacidade de investimento identificada e contato comercial ativo em andamento.</p>
        <p className="mt-2">Exemplo: hospital com orçamento aberto, reunião realizada e proposta em elaboração.</p>
        <p className="mt-2 text-xs font-medium text-[#3ecf8e]">Avanço para Cliente: quando o primeiro contrato, orçamento ou acordo é fechado (qualquer uma delas com status 'ganha').</p>
      </>
    ),
  },
  client: {
    title: 'O que é um Cliente?',
    body: `Um cliente é uma empresa com pelo menos um contrato fechado — relacionamento comercial ativo ou histórico de compra confirmado.

Exemplo: hospital com histórico de contratos, orçamentos ou acordos recorrentes, atendido pela carteira do vendedor.

Manutenção: monitorar Score de Saúde e ImC para evitar churn silencioso.

* Churn silencioso: quando um cliente para de comprar sem avisar — sem cancelamento formal, sem reclamação. O relacionamento esfria gradualmente até cessar. É o tipo mais difícil de detectar e o mais comum em carteiras grandes.`,
  },
};

/* ============================================================
   Card de resumo
   ============================================================ */
interface CardProps {
  kindKey: string;
  label: string;
  count: number;
  total: number;
  color: string;
  activeTooltip: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SummaryCard: React.FC<CardProps> = ({
  kindKey,
  label,
  count,
  total,
  color,
  activeTooltip,
  onMouseEnter,
  onMouseLeave,
}) => {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  const tip = TOOLTIP_CONTENT[kindKey];
  const visible = activeTooltip === kindKey;

  return (
    <div
      className="relative flex-1 text-center cursor-default bg-light-s1 dark:bg-dark-s1 border border-light-bmd dark:border-dark-bmd rounded-xl shadow-[var(--sh1)] p-5 transition hover:shadow-[var(--sh2)]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Tooltip */}
      {visible && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-72 p-4 rounded-xl bg-white dark:bg-dark-s2 border border-light-bmd dark:border-dark-bmd shadow-[var(--sh2)] text-left">
          <p className="text-sm font-medium text-light-t1 dark:text-dark-t1 mb-2">{tip.title}</p>
          <div className="text-xs text-light-t2 dark:text-dark-t2 leading-relaxed whitespace-pre-line">{tip.body}</div>
          {/* Seta */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-dark-s2 border-r border-b border-light-bmd dark:border-dark-bmd" />
        </div>
      )}

      <p className="text-3xl font-medium" style={{ color }}>{count}</p>
      <p className="text-sm font-medium text-light-t1 dark:text-dark-t1 mt-1">{label}</p>
      <p className="text-xs text-light-t3 dark:text-dark-t3 mt-1">{pct}% do total</p>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const FunilLeads: React.FC<FunilLeadsProps> = ({ tenantId }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery<{ kind: string }[]>({
    queryKey: ['funil-leads', tenantId],
    queryFn: () => fetchFunil(tenantId),
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  });

  /* ── Agregação ── */
  const leadCount     = (rows ?? []).filter((r) => r.kind === 'lead').length;
  const prospectCount = (rows ?? []).filter((r) => r.kind === 'prospect').length;
  const clientCount   = (rows ?? []).filter((r) => r.kind === 'client').length;
  const total         = leadCount + prospectCount + clientCount;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-accent-light border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Empty ── */
  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-light-t3 dark:text-dark-t3">
        Nenhum dado disponível
      </div>
    );
  }

  /* ── Opções ECharts ── */
  const counts: Record<string, number> = {
    Leads:     leadCount,
    Prospects: prospectCount,
    Clientes:  clientCount,
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string }) => {
        const c = counts[params.name] ?? 0;
        const pct = total > 0 ? ((c / total) * 100).toFixed(1) : '0';
        return `${params.name}: ${c} empresas (${pct}%)`;
      },
    },
    legend: { show: false },
    series: [
      {
        type: 'funnel',
        sort: 'none',
        gap: 6,
        left: '15%',
        width: '70%',
        top: 20,
        bottom: 20,
        min: 0,
        max: 100,
        label: {
          show: true,
          position: 'inside',
          fontFamily: 'DM Sans',
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
          formatter: (params: { name: string }) => {
            const c = counts[params.name] ?? 0;
            return `${params.name}\n${c}`;
          },
        },
        itemStyle: { borderWidth: 0 },
        data: [
          { name: 'Leads',     value: 100, itemStyle: { color: '#3b68f5' } },
          { name: 'Prospects', value: 66,  itemStyle: { color: '#f59e0b' } },
          { name: 'Clientes',  value: 33,  itemStyle: { color: '#3ecf8e' } },
        ],
      },
    ],
  };

  return (
    <div className="space-y-4">
      <ReactECharts option={option} style={{ height: '380px' }} opts={{ renderer: 'svg' }} />

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          kindKey="lead"
          label="Leads"
          count={leadCount}
          total={total}
          color="#3b68f5"
          activeTooltip={activeTooltip}
          onMouseEnter={() => setActiveTooltip('lead')}
          onMouseLeave={() => setActiveTooltip(null)}
        />
        <SummaryCard
          kindKey="prospect"
          label="Prospects"
          count={prospectCount}
          total={total}
          color="#f59e0b"
          activeTooltip={activeTooltip}
          onMouseEnter={() => setActiveTooltip('prospect')}
          onMouseLeave={() => setActiveTooltip(null)}
        />
        <SummaryCard
          kindKey="client"
          label="Clientes"
          count={clientCount}
          total={total}
          color="#3ecf8e"
          activeTooltip={activeTooltip}
          onMouseEnter={() => setActiveTooltip('client')}
          onMouseLeave={() => setActiveTooltip(null)}
        />
      </div>
    </div>
  );
};

export default FunilLeads;
