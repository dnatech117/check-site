import React from 'react';
import { Cpu, Layers, Cloud, BarChart3, Palette, CheckCircle2 } from 'lucide-react';
import { TechStackDetails, TechStackItem } from '../types/audit';

interface TechStackPanelProps {
  techStack?: TechStackDetails;
}

export const TechStackPanel: React.FC<TechStackPanelProps> = ({ techStack }) => {
  if (!techStack || techStack.items.length === 0) {
    return (
      <div className="card-premium p-4 rounded-xl text-center text-xs text-zinc-400">
        No third-party framework or platform signatures detected.
      </div>
    );
  }

  const frameworks = techStack.items.filter(i => i.category === 'Framework');
  const cms = techStack.items.filter(i => i.category === 'CMS');
  const infra = techStack.items.filter(i => i.category === 'CDN' || i.category === 'Hosting');
  const analytics = techStack.items.filter(i => i.category === 'Analytics');
  const libraries = techStack.items.filter(i => i.category === 'Library');

  const renderSection = (title: string, icon: React.ReactNode, items: TechStackItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] space-y-2">
        <div className="flex items-center gap-1.5 text-zinc-300">
          {icon}
          <h4 className="font-semibold text-xs text-white">{title}</h4>
          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
            {items.length} detected
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/[0.08] flex items-center gap-1.5"
            >
              <span className="font-medium text-white text-xs">{item.name}</span>
              {item.version && (
                <span className="text-[9px] font-mono text-zinc-400 bg-white/[0.08] px-1 py-0.2 rounded">
                  v{item.version}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5 font-sans text-xs">
      {/* Summary Header */}
      <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Technology Stack Detective</h4>
            <span className="text-[10px] text-zinc-400">
              {techStack.items.length} Software & Infrastructure Signatures
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-semibold">
          ACTIVE STACK
        </span>
      </div>

      {renderSection('Frontend Frameworks', <Cpu className="w-3.5 h-3.5 text-sky-400" />, frameworks)}
      {renderSection('Content Management (CMS)', <Layers className="w-3.5 h-3.5 text-indigo-400" />, cms)}
      {renderSection('Cloud CDN & Hosting', <Cloud className="w-3.5 h-3.5 text-amber-400" />, infra)}
      {renderSection('Analytics & Marketing Pixels', <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />, analytics)}
      {renderSection('CSS & Design Systems', <Palette className="w-3.5 h-3.5 text-rose-400" />, libraries)}
    </div>
  );
};
