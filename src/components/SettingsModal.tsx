import React, { useState } from 'react';
import { AuditSettings } from '../types/audit';
import { X, Sliders, RotateCcw, Check } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AuditSettings;
  onClose: () => void;
  onSave: (newSettings: AuditSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<AuditSettings>(settings);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-elevated w-full max-w-sm rounded-xl p-4 space-y-3.5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h3 className="font-semibold text-xs text-zinc-100">Audit Guidelines & Thresholds</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-2.5 text-xs">
          {/* Auto Audit Toggle */}
          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.06]">
            <div>
              <span className="font-medium text-zinc-200 block text-[11.5px]">Auto Audit</span>
              <span className="text-[10px] text-zinc-500">
                Trigger check on popup open
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.autoAuditOnOpen}
              onChange={(e) => setForm({ ...form, autoAuditOnOpen: e.target.checked })}
              className="w-3.5 h-3.5 rounded text-zinc-100 bg-zinc-800 border-zinc-700 cursor-pointer"
            />
          </div>

          {/* Link Status Check */}
          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/[0.06]">
            <div>
              <span className="font-medium text-zinc-200 block text-[11.5px]">Async 404 Ping</span>
              <span className="text-[10px] text-zinc-500">
                Check links via service worker
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.checkBrokenLinks}
              onChange={(e) => setForm({ ...form, checkBrokenLinks: e.target.checked })}
              className="w-3.5 h-3.5 rounded text-zinc-100 bg-zinc-800 border-zinc-700 cursor-pointer"
            />
          </div>

          {/* Title Bounds */}
          <div className="p-2 rounded bg-black/30 border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-zinc-200 block text-[11.5px]">
              Title Length ({form.minTitleLength} – {form.maxTitleLength} chars)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] text-zinc-500 block mb-0.5 font-mono">Min</label>
                <input
                  type="number"
                  value={form.minTitleLength}
                  onChange={(e) => setForm({ ...form, minTitleLength: parseInt(e.target.value) || 20 })}
                  className="w-full px-2 py-1 rounded bg-[#090C12] border border-white/[0.1] text-zinc-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-zinc-500 block mb-0.5 font-mono">Max</label>
                <input
                  type="number"
                  value={form.maxTitleLength}
                  onChange={(e) => setForm({ ...form, maxTitleLength: parseInt(e.target.value) || 60 })}
                  className="w-full px-2 py-1 rounded bg-[#090C12] border border-white/[0.1] text-zinc-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Description Bounds */}
          <div className="p-2 rounded bg-black/30 border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-zinc-200 block text-[11.5px]">
              Meta Description ({form.minDescLength} – {form.maxDescLength} chars)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] text-zinc-500 block mb-0.5 font-mono">Min</label>
                <input
                  type="number"
                  value={form.minDescLength}
                  onChange={(e) => setForm({ ...form, minDescLength: parseInt(e.target.value) || 50 })}
                  className="w-full px-2 py-1 rounded bg-[#090C12] border border-white/[0.1] text-zinc-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-zinc-500 block mb-0.5 font-mono">Max</label>
                <input
                  type="number"
                  value={form.maxDescLength}
                  onChange={(e) => setForm({ ...form, maxDescLength: parseInt(e.target.value) || 160 })}
                  className="w-full px-2 py-1 rounded bg-[#090C12] border border-white/[0.1] text-zinc-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium transition-colors flex items-center gap-1 text-[11px]"
            >
              {saved ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
