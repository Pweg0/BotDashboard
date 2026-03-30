'use client';

import { useEffect, useState, useCallback } from 'react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number | null;
  category: string;
  allowsMultiple: boolean;
  sortOrder: number;
  status: 'draft' | 'published';
  embedColor: number;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: string;
  allowsMultiple: boolean;
  sortOrder: string;
  embedColor: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
  stock: '',
  allowsMultiple: false,
  sortOrder: '0',
  embedColor: '#00b300',
};

function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function numberToHex(num: number): string {
  return '#' + num.toString(16).padStart(6, '0');
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        setActionError('Erro ao carregar produtos.');
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setActionError('Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreateForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock !== null ? String(product.stock) : '',
      allowsMultiple: product.allowsMultiple,
      sortOrder: String(product.sortOrder),
      embedColor: numberToHex(product.embedColor ?? 0x00b300),
    });
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Partial<FormData> = {};
    if (!formData.name.trim()) errors.name = 'Obrigatório';
    if (!formData.description.trim()) errors.description = 'Obrigatório';
    if (!formData.price || isNaN(Number(formData.price))) errors.price = 'Informe um valor válido';
    if (!formData.imageUrl.trim()) errors.imageUrl = 'Obrigatório';
    if (!formData.category.trim()) errors.category = 'Obrigatório';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setActionError(null);

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      imageUrl: formData.imageUrl,
      category: formData.category,
      stock: formData.stock !== '' ? Number(formData.stock) : null,
      allowsMultiple: formData.allowsMultiple,
      sortOrder: Number(formData.sortOrder) || 0,
      embedColor: hexToNumber(formData.embedColor),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error ?? 'Erro ao salvar produto.');
      } else {
        closeForm();
        await fetchProducts();
      }
    } catch {
      setActionError('Erro ao salvar produto.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error ?? 'Erro ao excluir produto.');
      } else {
        setDeleteConfirmId(null);
        await fetchProducts();
      }
    } catch {
      setActionError('Erro ao excluir produto.');
    }
  }

  async function handleTogglePublish(product: Product) {
    setActionError(null);
    try {
      const res = await fetch(`/api/products/${product._id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error ?? 'Erro ao alterar status.');
      } else {
        await fetchProducts();
      }
    } catch {
      setActionError('Erro ao alterar status.');
    }
  }

  const publishedCount = products.filter((p) => p.status === 'published').length;
  const draftCount = products.length - publishedCount;

  // Group products by category
  const grouped = products.reduce<Record<string, Product[]>>((acc, product) => {
    const cat = product.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});
  const categoryNames = Object.keys(grouped).sort();

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie o catalogo da loja</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.97] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
        >
          + Novo Produto
        </button>
      </div>

      {/* Stats */}
      <div className="animate-in delay-1 grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: products.length, color: 'text-white' },
          { label: 'Publicados', value: publishedCount, color: 'text-emerald-400' },
          { label: 'Rascunhos', value: draftCount, color: 'text-zinc-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#11131a] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {actionError && (
        <div className="animate-in bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-sm">{actionError}</p>
        </div>
      )}

      {/* Table */}
      <div className="animate-in delay-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">Nenhum produto cadastrado</p>
            <p className="text-zinc-600 text-sm mt-1">Crie seu primeiro produto para comecar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryNames.map((category, catIdx) => (
              <div key={category} className="bg-[#11131a] border border-white/[0.06] rounded-xl overflow-hidden animate-in" style={{ animationDelay: `${catIdx * 60}ms` }}>
                {/* Category header */}
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/[0.12] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{category}</h3>
                  <span className="text-[11px] text-zinc-600 font-medium">{grouped[category].length} produto{grouped[category].length !== 1 ? 's' : ''}</span>
                </div>

                {/* Products in category */}
                <div>
                  {grouped[category].map((product, i) => (
                    <div
                      key={product._id}
                      className={`flex items-center gap-4 pl-10 pr-5 py-3.5 hover:bg-white/[0.02] transition-colors ${i < grouped[category].length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                    >
                      {/* Indent line */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-zinc-700 select-none">&#8226;</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-200">{product.name}</p>
                          <p className="text-xs text-zinc-600 mt-0.5 truncate">{product.description}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="w-24 text-right">
                        <p className="text-sm text-zinc-300 tabular-nums">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                      </div>

                      {/* Stock */}
                      <div className="w-20 text-right">
                        <p className="text-xs text-zinc-500 tabular-nums">
                          {product.stock !== null ? `${product.stock} un.` : 'Ilimitado'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="w-24">
                        {product.status === 'published' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/[0.1] text-emerald-400 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 text-zinc-500 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            Rascunho
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditForm(product)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleTogglePublish(product)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            product.status === 'published'
                              ? 'text-amber-400 bg-amber-500/[0.08] hover:bg-amber-500/[0.14]'
                              : 'text-emerald-400 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                          }`}
                        >
                          {product.status === 'published' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product._id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.14] rounded-lg transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all ${
                    formErrors.name ? 'border-red-500/50' : 'border-white/[0.08]'
                  }`}
                  placeholder="Ex: VIP Bronze"
                />
                {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
              </div>

              {/* Descricao */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Descricao <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 resize-none transition-all ${
                    formErrors.description ? 'border-red-500/50' : 'border-white/[0.08]'
                  }`}
                  placeholder="Descreva o produto..."
                  rows={3}
                />
                {formErrors.description && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Preco (R$) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all ${
                      formErrors.price ? 'border-red-500/50' : 'border-white/[0.08]'
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.price && <p className="text-red-400 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  URL da Imagem <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all ${
                    formErrors.imageUrl ? 'border-red-500/50' : 'border-white/[0.08]'
                  }`}
                  placeholder="https://exemplo.com/imagem.png"
                />
                {formErrors.imageUrl && <p className="text-red-400 text-xs mt-1">{formErrors.imageUrl}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Categoria <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all ${
                    formErrors.category ? 'border-red-500/50' : 'border-white/[0.08]'
                  }`}
                  placeholder="Ex: VIP, Kits, Itens"
                />
                {formErrors.category && <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Ordem de exibicao
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Cor do embed
                  </label>
                  <input
                    type="color"
                    value={formData.embedColor}
                    onChange={(e) => setFormData({ ...formData, embedColor: e.target.value })}
                    className="w-full h-[42px] px-1.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="allowsMultiple"
                  checked={formData.allowsMultiple}
                  onChange={(e) => setFormData({ ...formData, allowsMultiple: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500/40"
                />
                <label htmlFor="allowsMultiple" className="text-sm text-zinc-400">
                  Permite comprar multiplas unidades
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all duration-200"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
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
            <div className="w-12 h-12 rounded-full bg-red-500/[0.1] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white text-center mb-2">Confirmar exclusao</h2>
            <p className="text-zinc-500 text-sm text-center mb-6">
              Tem certeza que deseja excluir este produto? Esta acao nao pode ser desfeita.
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
