'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Category {
  _id: string;
  name: string;
  channelId: string;
  sortOrder: number;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formChannelId, setFormChannelId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) { setError('Erro ao carregar categorias.'); return; }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openCreateForm() {
    setEditingId(null);
    setFormName('');
    setFormChannelId('');
    setShowForm(true);
  }

  function openEditForm(cat: Category) {
    setEditingId(cat._id);
    setFormName(cat.name);
    setFormChannelId(cat.channelId);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formChannelId.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, channelId: formChannelId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erro ao salvar categoria.');
      } else {
        setShowForm(false);
        setEditingId(null);
        await fetchCategories();
      }
    } catch {
      setError('Erro ao salvar categoria.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erro ao excluir categoria.');
      } else {
        setDeleteConfirmId(null);
        await fetchCategories();
      }
    } catch {
      setError('Erro ao excluir categoria.');
    }
  }

  // Drag & drop reorder
  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...categories];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    setCategories(reordered);
    dragItem.current = null;
    dragOverItem.current = null;

    // Persist new order
    try {
      await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered.map((c) => c._id) }),
      });
    } catch {
      setError('Erro ao salvar ordem.');
      await fetchCategories();
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie as categorias e seus canais no Discord</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.97] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
        >
          + Nova Categoria
        </button>
      </div>

      {error && (
        <div className="animate-in bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* List */}
      <div className="animate-in delay-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">Nenhuma categoria criada</p>
            <p className="text-zinc-600 text-sm mt-1">Crie categorias para organizar seus produtos por canal</p>
          </div>
        ) : (
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Arraste para reordenar</p>
            </div>
            {categories.map((cat, i) => (
              <div
                key={cat._id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${i < categories.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
              >
                {/* Drag handle */}
                <div className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-violet-500/[0.12] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5 font-mono">Canal: {cat.channelId}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditForm(cat)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(cat._id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.14] rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nome da categoria
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  placeholder="Ex: ranks-vip, kits, itens"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  ID do canal no Discord
                </label>
                <input
                  type="text"
                  value={formChannelId}
                  onChange={(e) => setFormChannelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all font-mono"
                  placeholder="Ex: 1234567890123456789"
                />
                <p className="text-xs text-zinc-600 mt-1.5">
                  Clique com botao direito no canal do Discord → Copiar ID do canal
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting || !formName.trim() || !formChannelId.trim()}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all duration-200"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50">
            <h2 className="text-lg font-bold text-white text-center mb-2">Excluir categoria</h2>
            <p className="text-zinc-500 text-sm text-center mb-6">
              Produtos dessa categoria nao serao excluidos, mas ficarao sem canal configurado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Excluir
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
