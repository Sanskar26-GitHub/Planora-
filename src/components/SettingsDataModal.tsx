import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { storage } from '../services/storage';

interface SettingsDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsDataModal: React.FC<SettingsDataModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    hasApiKey: boolean;
    service?: string;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkServerHealth();
    }
  }, [isOpen]);

  const checkServerHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      } else {
        setServerHealth({ status: 'error', hasApiKey: false });
      }
    } catch {
      setServerHealth({ status: 'offline', hasApiKey: false });
    } finally {
      setHealthLoading(false);
    }
  };

  const handleExportBackup = () => {
    storage.exportBackup();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storage.importBackup(content);
      setImportStatus(res);
      if (res.success) {
        onDataChanged();
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleLoadSample = () => {
    storage.loadSampleEvent();
    onDataChanged();
    setImportStatus({
      success: true,
      message: 'Loaded sample Heritage Wedding event successfully.',
    });
  };

  const handleResetData = () => {
    storage.resetAllData();
    setShowResetConfirm(false);
    onDataChanged();
    setImportStatus({
      success: true,
      message: 'All local event records cleared.',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#142d22]">Settings & Data Management</h2>
            <p className="text-xs text-[#716859]">Data persistence, backup exports, and engine status</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#716859] hover:text-[#142d22] rounded-md hover:bg-[#ede7dd]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
        {importStatus && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              importStatus.success
                ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Server & API Key Health Check */}
        <div className="bg-[#f8f6f0] border border-[#e7e1d7] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-[#142d22]">
            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#1b4332]" />
              <span>Full-Stack Engine Status</span>
            </div>
            <button
              onClick={checkServerHealth}
              disabled={healthLoading}
              className="text-[11px] text-[#1b4332] hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-1 text-[#5c5344] text-[11px]">
            <div className="flex items-center justify-between">
              <span>Express Backend:</span>
              <span className="font-medium text-[#166534]">
                {serverHealth ? `${serverHealth.status} (port 3000)` : 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Server-side GEMINI_API_KEY:</span>
              <span className="font-medium">
                {serverHealth?.hasApiKey ? (
                  <span className="text-[#166534] font-semibold">Active & Injected</span>
                ) : (
                  <span className="text-[#c86d51]">Not Injected (Set in Settings &gt; Secrets)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Persistence & Backup Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#142d22] uppercase tracking-wider">
            Data Portability & Backup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON */}
            <button
              onClick={handleExportBackup}
              className="p-3 text-left bg-white border border-[#dcd4c7] hover:border-[#1b4332] rounded-lg transition-colors flex items-center gap-3 text-xs"
            >
              <Download className="w-5 h-5 text-[#1b4332] shrink-0" />
              <div>
                <div className="font-semibold text-[#142d22]">Export JSON Backup</div>
                <div className="text-[11px] text-[#716859]">Download all event data</div>
              </div>
            </button>

            {/* Import JSON */}
            <label className="p-3 text-left bg-white border border-[#dcd4c7] hover:border-[#1b4332] rounded-lg transition-colors flex items-center gap-3 text-xs cursor-pointer">
              <Upload className="w-5 h-5 text-[#2d6a4f] shrink-0" />
              <div>
                <div className="font-semibold text-[#142d22]">Restore from Backup</div>
                <div className="text-[11px] text-[#716859]">Upload Planora JSON file</div>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Sample Event & Reset */}
        <div className="space-y-3 pt-2 border-t border-[#e7e1d7]">
          <h3 className="text-xs font-bold text-[#142d22] uppercase tracking-wider">
            Sample Templates & Reset
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f2eee6] text-[#1b4332] border border-[#dcd4c7] hover:bg-[#ede7dd] rounded-md text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Load Sample Wedding Event</span>
            </button>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetData}
                  className="px-3 py-2 bg-[#c86d51] hover:bg-red-700 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Yes, Erase All
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-2 bg-[#ede7dd] text-[#2c261e] rounded-md text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-[#991b1b] hover:bg-[#fee2e2] rounded-md text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e7e1d7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b4332] text-white text-xs font-semibold rounded-md hover:bg-[#2d6a4f]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
