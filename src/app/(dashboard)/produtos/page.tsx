'use client';

import { useCallback, useEffect, useState } from 'react';

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
  return `#${num.toString(16).padStart(6, '0')}`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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

  const publishedCount = products.filter((product) => product.status === 'published').length;
  const draftCount = products.length - publishedCount;
  const unlimitedCount = products.filter((product) => product.stock === null).length;
  const categoryCount = new Set(products.map((product) => product.category)).size;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="glass-panel animate-fade-up stagger-1 rounded-[28px] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="hud-label mb-3">Product Command</p>
              <h1 className="tech-title text-4xl font-semibold text-white">
                Catálogo com leitura premium e foco em ação rápida
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                A tela foi pensada para parecer mais tecnológica: hierarquia forte, cards de
                telemetria, contraste controlado e ações bem destacadas sem perder densidade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchProducts}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-white"
              >
                Atualizar painel
              </button>
              <button
                onClick={openCreateForm}
                className="rounded-2xl bg-[linear-gradient(135deg,#70d1ff,#29f0b4)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_45px_rgba(41,240,180,0.2)] hover:-translate-y-0.5"
              >
                Novo produto
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel animate-fade-up stagger-2 rounded-[28px] p-6">
          <p className="hud-label mb-3">Preview do sistema</p>
          <div className="space-y-4">
            <div className="rounded-3xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(112,209,255,0.14),rgba(9,18,34,0.16))] p-4">
              <p className="mono text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
                Feed Estético
              </p>
              <p className="mt-3 text-lg font-semibold text-white">Glass + neon controlado</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Mais profundidade visual, menos sensação de painel padrão em Tailwind.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.75)]" />
              <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
                Interface calibrada para uso desktop e mobile
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: 'Produtos totais', value: String(products.length), tone: 'cyan' },
          { label: 'Publicados', value: String(publishedCount), tone: 'emerald' },
          { label: 'Rascunhos', value: String(draftCount), tone: 'violet' },
          { label: 'Categorias', value: String(categoryCount || 0), tone: 'amber' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`glass-panel animate-fade-up rounded-[24px] p-5 ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : index === 2 ? 'stagger-3' : 'stagger-4'}`}
          >
            <p className="mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              {item.label}
            </p>
            <div className="mt-4 flex items-end justify-between">
              <p className="tech-title text-4xl font-semibold text-white">{item.value}</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
                  item.tone === 'cyan'
                    ? 'bg-cyan-400/12 text-cyan-200'
                    : item.tone === 'emerald'
                      ? 'bg-emerald-400/12 text-emerald-200'
                      : item.tone === 'violet'
                        ? 'bg-violet-400/12 text-violet-200'
                        : 'bg-amber-400/12 text-amber-200'
                }`}
              >
                Live
              </span>
            </div>
          </div>
        ))}
      </section>

      {actionError && (
        <div className="animate-fade-up glass-panel rounded-[24px] border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          {actionError}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="glass-panel animate-fade-up stagger-2 overflow-hidden rounded-[30px]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="hud-label mb-2">Catalog Matrix</p>
              <h2 className="text-xl font-semibold text-white">Produtos monitorados</h2>
            </div>
            <div className="mono flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <span className="rounded-full border border-white/10 px-3 py-1">Ordenado por prioridade</span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {unlimitedCount} sem limite
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-slate-400">Sincronizando catálogo...</div>
          ) : products.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-lg font-medium text-white">Nenhum produto cadastrado</p>
              <p className="mt-2 text-sm text-slate-400">
                O layout já está pronto para um catálogo mais premium assim que os itens entrarem.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    {['Produto', 'Categoria', 'Preço', 'Estoque', 'Status', 'Ações'].map((label) => (
                      <th
                        key={label}
                        className="px-6 py-4 text-[11px] uppercase tracking-[0.24em] text-slate-500"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className="border-b border-white/6 bg-white/[0.01] hover:bg-cyan-400/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="h-12 w-12 rounded-2xl border border-white/10"
                            style={{
                              background: `linear-gradient(135deg, ${numberToHex(
                                product.embedColor ?? 0x00b300
                              )}, rgba(255,255,255,0.08))`,
                            }}
                          />
                          <div>
                            <p className="font-medium text-white">{product.name}</p>
                            <p className="mt-1 max-w-xs text-sm text-slate-400">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/6 px-3 py-1 text-sm text-slate-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatMoney(product.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {product.stock !== null ? product.stock : 'Ilimitado'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${
                            product.status === 'published'
                              ? 'bg-emerald-400/12 text-emerald-200'
                              : 'bg-white/8 text-slate-300'
                          }`}
                        >
                          {product.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditForm(product)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-300/25 hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleTogglePublish(product)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                              product.status === 'published'
                                ? 'bg-amber-400/12 text-amber-200 hover:bg-amber-400/20'
                                : 'bg-emerald-400/12 text-emerald-200 hover:bg-emerald-400/20'
                            }`}
                          >
                            {product.status === 'published' ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(product._id)}
                            className="rounded-xl bg-rose-400/12 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/20"
                          >
                            Excluir
                          </button>
                        </div>
                        <p className="mono mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-600">
                          Slot {String(index + 1).padStart(2, '0')} / Ordem {product.sortOrder}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-panel animate-fade-up stagger-3 rounded-[28px] p-6">
            <p className="hud-label mb-3">Mudanças de UX</p>
            <ul className="space-y-3 text-sm leading-6 text-slate-400">
              <li>Tabelas com maior respiração visual e ações mais localizadas.</li>
              <li>Cards de resumo para leitura imediata antes da lista detalhada.</li>
              <li>Contraste mais fino com luz ciano e verde no lugar de cinza chapado.</li>
              <li>Motion discreto para parecer sofisticado, não chamativo demais.</li>
            </ul>
          </div>

          <div className="glass-panel animate-fade-up stagger-4 rounded-[28px] p-6">
            <p className="hud-label mb-3">Próximos upgrades</p>
            <div className="space-y-4">
              {[
                'Busca instantânea por nome e categoria',
                'Preview de thumbnail antes de salvar',
                'Indicador de produto mais vendido',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(112,209,255,0.8)]" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-md">
          <div className="glass-panel-strong w-full max-w-3xl overflow-hidden rounded-[30px]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="hud-label mb-2">Editor</p>
                <h2 className="text-2xl font-semibold text-white">
                  {editingId ? 'Refinar produto' : 'Criar novo produto'}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/25 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div>
                  <label className="hud-label mb-2 block">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none ${
                      formErrors.name ? 'border-rose-400/40' : 'border-white/10'
                    }`}
                    placeholder="Ex: VIP Bronze"
                  />
                  {formErrors.name && <p className="mt-2 text-xs text-rose-300">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="hud-label mb-2 block">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`min-h-[132px] w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none ${
                      formErrors.description ? 'border-rose-400/40' : 'border-white/10'
                    }`}
                    placeholder="Explique valor percebido, benefícios e diferencial do item."
                  />
                  {formErrors.description && (
                    <p className="mt-2 text-xs text-rose-300">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="hud-label mb-2 block">Preço</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none ${
                        formErrors.price ? 'border-rose-400/40' : 'border-white/10'
                      }`}
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="mt-2 text-xs text-rose-300">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="hud-label mb-2 block">Estoque</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="Vazio = ilimitado"
                    />
                  </div>
                </div>

                <div>
                  <label className="hud-label mb-2 block">Imagem</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none ${
                      formErrors.imageUrl ? 'border-rose-400/40' : 'border-white/10'
                    }`}
                    placeholder="https://..."
                  />
                  {formErrors.imageUrl && (
                    <p className="mt-2 text-xs text-rose-300">{formErrors.imageUrl}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="hud-label mb-2 block">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white outline-none ${
                      formErrors.category ? 'border-rose-400/40' : 'border-white/10'
                    }`}
                    placeholder="VIP, kits, itens"
                  />
                  {formErrors.category && (
                    <p className="mt-2 text-xs text-rose-300">{formErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="hud-label mb-2 block">Ordem de exibição</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="glass-panel rounded-[24px] p-4">
                  <label className="hud-label mb-3 block">Aparência do embed</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.embedColor}
                      onChange={(e) => setFormData({ ...formData, embedColor: e.target.value })}
                      className="h-14 w-16 cursor-pointer rounded-2xl border border-white/10 bg-transparent"
                    />
                    <div
                      className="flex-1 rounded-[20px] border border-white/10 p-4"
                      style={{
                        background: `linear-gradient(135deg, ${formData.embedColor}, rgba(255,255,255,0.06))`,
                      }}
                    >
                      <p className="text-sm font-medium text-slate-950">Preview de destaque</p>
                      <p className="mt-1 text-xs text-slate-900/75">
                        Cor aplicada para visual do card no Discord.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="glass-panel flex items-center gap-3 rounded-[24px] p-4">
                  <input
                    type="checkbox"
                    checked={formData.allowsMultiple}
                    onChange={(e) => setFormData({ ...formData, allowsMultiple: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">Compra múltipla</span>
                    <span className="block text-xs text-slate-400">
                      Permite mais de uma unidade por pedido.
                    </span>
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-2xl bg-[linear-gradient(135deg,#70d1ff,#29f0b4)] px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                  >
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="glass-panel-strong w-full max-w-md rounded-[30px] p-6">
            <p className="hud-label mb-3">Danger Zone</p>
            <h2 className="text-2xl font-semibold text-white">Excluir produto</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              A ação remove o item do fluxo administrativo. Use com cuidado para não quebrar o
              catálogo publicado.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Confirmar exclusão
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
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
