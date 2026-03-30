'use client';

import { useEffect, useState, useCallback } from 'react';

interface Settings {
  guildId: string;
  ordersChannelId: string;
  deliveredChannelId: string;
  adminRoleId: string;
  masterUserId: string;
}

const FIELDS: { key: keyof Omit<Settings, 'guildId'>; label: string; description: string }[] = [
  { key: 'ordersChannelId', label: 'Canal de Pedidos', description: 'Canal onde embeds de pedidos pagos são postados' },
  { key: 'deliveredChannelId', label: 'Canal de Entregues', description: 'Canal para onde embeds de pedidos entregues são movidos' },
  { key: 'adminRoleId', label: 'Cargo de Admin', description: 'ID do cargo que dá acesso ao painel admin' },
  { key: 'masterUserId', label: 'Usuario Master', description: 'ID do usuario Discord com acesso total (configurações)' },
];

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        setError('Erro ao carregar configurações.');
        return;
      }
      const data = await res.json();
      setSettings(data);
    } catch {
      setError('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordersChannelId: settings.ordersChannelId,
          deliveredChannelId: settings.deliveredChannelId,
          adminRoleId: settings.adminRoleId,
          masterUserId: settings.masterUserId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erro ao salvar.');
      } else {
        const data = await res.json();
        setSettings(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="max-w-[800px] mx-auto">
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/[0.1] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v.01M12 12v-4m0 12a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
          </div>
          <p className="text-red-300 font-medium">Acesso restrito</p>
          <p className="text-red-400/60 text-sm mt-1">Apenas o usuario master pode acessar as configuracoes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
        <p className="text-sm text-zinc-500 mt-1">Defina os canais e cargos do servidor</p>
      </div>

      {error && (
        <div className="animate-in bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="animate-in bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-300 text-sm">Configuracoes salvas com sucesso!</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : settings && (
        <div className="animate-in delay-1 space-y-4">
          {/* Guild ID (read-only) */}
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-white">Guild ID</label>
                <p className="text-xs text-zinc-600 mt-0.5">ID do servidor Discord (somente leitura)</p>
              </div>
            </div>
            <input
              type="text"
              value={settings.guildId}
              readOnly
              className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-zinc-500 text-sm font-mono"
            />
          </div>

          {/* Editable fields */}
          {FIELDS.map((field) => (
            <div key={field.key} className="bg-[#11131a] border border-white/[0.06] rounded-xl p-5">
              <div className="mb-3">
                <label className="text-sm font-medium text-white">{field.label}</label>
                <p className="text-xs text-zinc-600 mt-0.5">{field.description}</p>
              </div>
              <input
                type="text"
                value={settings[field.key]}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                placeholder="Cole o ID aqui"
              />
            </div>
          ))}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.97] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
            >
              {saving ? 'Salvando...' : 'Salvar configuracoes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
