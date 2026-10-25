import React from 'react';
import { AuditSummary, IssueSeverity } from '../types/audit';

interface AuditSummaryCardsProps {
  summary: AuditSummary;
  selectedSeverity?: IssueSeverity | 'all';
  onSelectSeverity?: (severity: IssueSeverity | 'all') => void;
}

export const AuditSummaryCards: React.FC<AuditSummaryCardsProps> = ({
  summary,
  selectedSeverity = 'all',
  onSelectSeverity,
}) => {
  const cards = [
    {
      id: 'critical' as IssueSeverity,
      label: 'Critical',
      count: summary.critical,
      textColor: 'text-rose-400',
      dotColor: 'bg-rose-500',
      activeClass: 'border-rose-500/50 bg-rose-500/[0.1]',
    },
    {
      id: 'warning' as IssueSeverity,
      label: 'Warning',
      count: summary.warning,
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
      activeClass: 'border-amber-500/50 bg-amber-500/[0.1]',
    },
    {
      id: 'notice' as IssueSeverity,
      label: 'Notice',
      count: summary.notice,
      textColor: 'text-sky-400',
      dotColor: 'bg-sky-500',
      activeClass: 'border-sky-500/50 bg-sky-500/[0.1]',
    },
    {
      id: 'good' as IssueSeverity,
      label: 'Passed',
      count: summary.good,
      textColor: 'text-white',
      dotColor: 'bg-white',
      activeClass: 'border-white/50 bg-white/[0.12]',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cards.map((card) => {
        const isSelected = selectedSeverity === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              if (onSelectSeverity) {
                onSelectSeverity(isSelected ? 'all' : card.id);
              }
            }}
            className={`flex flex-col items-start p-2 rounded-lg border transition-all text-left ${
              isSelected 
                ? card.activeClass 
                : 'border-white/[0.08] bg-[#101013] hover:bg-[#16161A] hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center gap-1.5 w-full mb-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.dotColor}`} />
              <span className="text-[10px] font-medium text-zinc-400 truncate">
                {card.label}
              </span>
            </div>
            <span className={`text-sm font-bold font-mono tabular-nums leading-tight ${card.textColor}`}>
              {card.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
