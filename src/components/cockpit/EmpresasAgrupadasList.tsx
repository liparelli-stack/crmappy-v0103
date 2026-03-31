/*
-- ===================================================
-- Código             : /src/components/cockpit/EmpresasAgrupadasList.tsx
-- Versão             : 2.0.0
-- Data/Hora          : 2026-03-31 America/Sao_Paulo
-- Objetivo           : Lista de empresas com ações ativas agrupada alfabeticamente.
--                      Inclui header com título + botões A→Z e collapse geral.
--                      Persistência completa dos 3 estados em localStorage.
-- Dependências       : @/types/cockpit, @/utils/textNormalization, clsx, lucide-react
-- ===================================================
*/

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import type { CompanyWithActionCount } from '@/types/cockpit';
import { normalizeText } from '@/utils/textNormalization';

function formatCurrencyK(value: number): string {
  return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
}

interface Props {
  empresas: CompanyWithActionCount[];
  selectedCompanyId: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string) => void;
}

const EmpresasAgrupadasList: React.FC<Props> = ({
  empresas,
  selectedCompanyId,
  onSelect,
  onHover,
}) => {
  // ── Estado 1: ordenação ──────────────────────────────────────
  const [sortAsc, setSortAsc] = useState<boolean>(() =>
    localStorage.getItem('crmappy.activeCompanies.sortAsc') !== 'false'
  );

  // ── Estado 2: colapsar/expandir todos ────────────────────────
  const [allCollapsed, setAllCollapsed] = useState<boolean>(() =>
    localStorage.getItem('crmappy.activeCompanies.allCollapsed') === 'true'
  );

  // ── Estado 3: estado individual por grupo ────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('crmappy.activeCompanies.groupStates') || '{}');
    } catch { return {}; }
  });

  // ── Funções com persistência imediata ────────────────────────
  const toggleSortAsc = () => {
    setSortAsc(prev => {
      const next = !prev;
      localStorage.setItem('crmappy.activeCompanies.sortAsc', String(next));
      return next;
    });
  };

  const toggleAll = () => {
    const anyOpen = letras.some(l => !isGroupCollapsed(l));
    const next = anyOpen ? true : false;
    setAllCollapsed(next);
    localStorage.setItem('crmappy.activeCompanies.allCollapsed', String(next));
    setCollapsedGroups({});
    localStorage.setItem('crmappy.activeCompanies.groupStates', '{}');
  };

  const isGroupCollapsed = (letter: string): boolean => {
    if (letter in collapsedGroups) return collapsedGroups[letter];
    return allCollapsed;
  };

  const toggleGroup = (letter: string) => {
    const current = isGroupCollapsed(letter);
    const next = { ...collapsedGroups, [letter]: !current };
    setCollapsedGroups(next);
    localStorage.setItem('crmappy.activeCompanies.groupStates', JSON.stringify(next));
  };

  // ── Agrupamento e ordenação ───────────────────────────────────
  const grupos = useMemo(() => {
    const map: Record<string, CompanyWithActionCount[]> = {};
    for (const emp of empresas) {
      const letra = normalizeText(emp.trade_name)[0]?.toUpperCase() ?? '#';
      if (!map[letra]) map[letra] = [];
      map[letra].push(emp);
    }
    for (const letra of Object.keys(map)) {
      map[letra].sort((a, b) =>
        normalizeText(a.trade_name).localeCompare(normalizeText(b.trade_name))
      );
    }
    return map;
  }, [empresas]);

  const letras = useMemo(
    () => Object.keys(grupos).sort((a, b) => sortAsc ? a.localeCompare(b) : b.localeCompare(a)),
    [grupos, sortAsc]
  );

  // ── Render ────────────────────────────────────────────────────
  const anyOpen = letras.some(l => !isGroupCollapsed(l));

  return (
    <>
      {/* Header: título + botões */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-bold">Empresas com Ações Ativas</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSortAsc}
            className="text-xs font-medium px-2 py-0.5 rounded bg-light-s2 dark:bg-dark-s2 text-light-t2 dark:text-dark-t2 border border-light-bmd dark:border-dark-bmd hover:text-light-t1 dark:hover:text-dark-t1 cursor-pointer transition-colors"
          >
            {sortAsc ? 'A→Z' : 'Z→A'}
          </button>
          <button type="button" onClick={toggleAll} className="p-0.5">
            {anyOpen
              ? <ChevronUp   className="w-4 h-4 text-light-t3 dark:text-dark-t3 cursor-pointer hover:text-light-t1 dark:hover:text-dark-t1 transition-colors" />
              : <ChevronDown className="w-4 h-4 text-light-t3 dark:text-dark-t3 cursor-pointer hover:text-light-t1 dark:hover:text-dark-t1 transition-colors" />
            }
          </button>
        </div>
      </div>

      {/* Lista agrupada */}
      {empresas.length === 0 ? (
        <p className="text-center text-light-t3 dark:text-dark-t3 text-sm p-4">
          Nenhuma empresa com ações ativas.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-visible pb-2">
          {letras.map((letra) => {
            const isOpen = !isGroupCollapsed(letra);
            const emps = grupos[letra];

            return (
              <div key={letra}>
                {/* Cabeçalho do grupo */}
                <button
                  type="button"
                  onClick={() => toggleGroup(letra)}
                  className={clsx(
                    'w-full flex items-center gap-2 text-left',
                    'px-3.5 py-1.5',
                    'border-b border-light-blo dark:border-dark-blo',
                    'hover:bg-light-s2 dark:hover:bg-dark-s2',
                    'transition-colors duration-200'
                  )}
                >
                  <ChevronDown
                    className={clsx(
                      'h-3.5 w-3.5 flex-shrink-0 text-light-t3 dark:text-dark-t3',
                      'transition-transform duration-200',
                      !isOpen && '-rotate-90'
                    )}
                  />
                  <span className="text-body font-medium text-light-t1 dark:text-dark-t1">
                    {letra}
                  </span>
                  <span className="text-label text-light-t3 dark:text-dark-t3">
                    ({emps.length} {emps.length === 1 ? 'empresa' : 'empresas'})
                  </span>
                </button>

                {/* Itens do grupo */}
                {isOpen && (
                  <ul>
                    {emps.map((emp) => {
                      const isActive = selectedCompanyId === emp.id;
                      return (
                        <li key={emp.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(emp.id)}
                            onMouseEnter={() => onHover?.(emp.id)}
                            className={clsx(
                              'w-full flex items-center gap-2 text-left',
                              'pl-[38px] pr-3 py-[7px]',
                              'border-b border-light-blo dark:border-dark-blo',
                              'transition-colors duration-150',
                              isActive
                                ? 'bg-light-s2 dark:bg-dark-s3 text-accent'
                                : 'text-light-t1 dark:text-dark-t1 hover:bg-light-blo dark:hover:bg-dark-blo'
                            )}
                          >
                            <span
                              className="text-caption font-normal truncate flex-1 min-w-0"
                              title={emp.trade_name}
                            >
                              {emp.trade_name}
                            </span>
                            <span className="text-micro font-mono text-light-t2 dark:text-dark-t2 flex-shrink-0 tabular-nums whitespace-nowrap hidden sm:inline">
                              {emp.action_count} {emp.action_count === 1 ? 'ação' : 'ações'}
                            </span>
                            <span
                              className="text-micro font-mono font-medium text-accent tabular-nums tracking-tight-md whitespace-nowrap hidden sm:inline flex-shrink-0"
                              title={`Em Aberto: ${formatCurrencyK(emp.valor_abertos)} | Ganhos: ${formatCurrencyK(emp.valor_ganhos)} | Perdidos: ${formatCurrencyK(emp.valor_perdidos)}`}
                            >
                              {formatCurrencyK(emp.valor_total_orcamentos)}
                            </span>
                            <ChevronRight
                              className={clsx(
                                'h-3 w-3 flex-shrink-0',
                                isActive
                                  ? 'text-accent'
                                  : 'text-light-t3 dark:text-dark-t3'
                              )}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default EmpresasAgrupadasList;
