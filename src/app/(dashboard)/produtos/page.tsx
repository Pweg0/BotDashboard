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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Novo Produto
        </button>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
          {actionError}
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : products.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Nome</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Preço</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Categoria</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Estoque</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-gray-200 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-300">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{product.category}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {product.stock !== null ? product.stock : 'Ilimitado'}
                  </td>
                  <td className="px-4 py-3">
                    {product.status === 'published' ? (
                      <span className="px-2 py-1 bg-green-900/60 text-green-400 rounded text-xs font-medium border border-green-800">
                        Publicado
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs font-medium border border-gray-600">
                        Rascunho
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          product.status === 'published'
                            ? 'bg-yellow-700 hover:bg-yellow-600 text-white'
                            : 'bg-green-700 hover:bg-green-600 text-white'
                        }`}
                      >
                        {product.status === 'published' ? 'Despublicar' : 'Publicar'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(product._id)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Ex: VIP Bronze"
                />
                {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none ${
                    formErrors.description ? 'border-red-500' : 'border-gray-600'
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Preço (R$) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                      formErrors.price ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.price && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Estoque (vazio = ilimitado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL da Imagem <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                    formErrors.imageUrl ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="https://exemplo.com/imagem.png"
                />
                {formErrors.imageUrl && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.imageUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoria <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                    formErrors.category ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Ex: VIP, Kits, Itens"
                />
                {formErrors.category && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Ordem de exibição
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Cor do embed
                  </label>
                  <input
                    type="color"
                    value={formData.embedColor}
                    onChange={(e) => setFormData({ ...formData, embedColor: e.target.value })}
                    className="w-full h-10 px-1 py-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowsMultiple"
                  checked={formData.allowsMultiple}
                  onChange={(e) => setFormData({ ...formData, allowsMultiple: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <label htmlFor="allowsMultiple" className="text-sm text-gray-300">
                  Permite comprar múltiplas unidades
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-2">Confirmar exclusão</h2>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Excluir
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
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
