'use client';

import { useEffect, useState, useCallback } from 'react';

type OrderStatus = 'todos' | 'pending_payment' | 'paid' | 'delivered' | 'cancelled' | 'expired';

interface Order {
  _id: string;
  username: string;
  productSnapshot: { name: string; price: number };
  quantity: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

const STATUS_TABS: { key: OrderStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pending_payment', label: 'Pendente' },
  { key: 'paid', label: 'Pago' },
  { key: 'delivered', label: 'Entregue' },
  { key: 'cancelled', label: 'Cancelado' },
  { key: 'expired', label: 'Expirado' },
];

const STATUS_BADGE: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending_payment: { label: 'Pendente', dot: 'bg-amber-400', bg: 'bg-amber-500/[0.1]', text: 'text-amber-400' },
  paid: { label: 'Pago', dot: 'bg-emerald-400', bg: 'bg-emerald-500/[0.1]', text: 'text-emerald-400' },
  delivered: { label: 'Entregue', dot: 'bg-blue-400', bg: 'bg-blue-500/[0.1]', text: 'text-blue-400' },
  cancelled: { label: 'Cancelado', dot: 'bg-red-400', bg: 'bg-red-500/[0.1]', text: 'text-red-400' },
  expired: { label: 'Expirado', dot: 'bg-zinc-500', bg: 'bg-zinc-500/[0.1]', text: 'text-zinc-400' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const limit = 20;

  const fetchOrders = useCallback(
    async (status: OrderStatus, currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });
        if (status !== 'todos') {
          params.set('status', status);
        }
        const res = await fetch(`/api/orders?${params.toString()}`);
        if (!res.ok) {
          setError('Erro ao carregar pedidos.');
          return;
        }
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotal(data.total ?? 0);
      } catch {
        setError('Erro ao carregar pedidos.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(activeStatus, page);
  }, [fetchOrders, activeStatus, page]);

  function handleStatusChange(status: OrderStatus) {
    setActiveStatus(status);
    setPage(0);
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erro ao cancelar pedido.');
        return;
      }
      await fetchOrders(activeStatus, page);
    } catch {
      setError('Erro ao cancelar pedido.');
    } finally {
      setCancellingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe todos os pedidos da loja</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">{total} pedido{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="animate-in delay-1 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusChange(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeStatus === tab.key
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="animate-in bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="animate-in delay-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">Nenhum pedido encontrado</p>
            <p className="text-zinc-600 text-sm mt-1">Os pedidos aparecerao aqui quando forem realizados</p>
          </div>
        ) : (
          <div className="bg-[#11131a] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['ID', 'Comprador', 'Produto', 'Qtd', 'Valor', 'Status', 'Data', 'Acoes'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const badge = STATUS_BADGE[order.status] ?? {
                      label: order.status,
                      dot: 'bg-zinc-600',
                      bg: 'bg-zinc-800/80',
                      text: 'text-zinc-500',
                    };
                    return (
                      <tr
                        key={order._id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors animate-in"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-5 py-3.5 text-xs text-zinc-600 font-mono">
                          {order._id.slice(-8)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-200 font-medium">{order.username}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-400">
                          {order.productSnapshot?.name ?? '-'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-400 text-center tabular-nums">{order.quantity}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-300 tabular-nums">
                          R$ {order.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${badge.bg} ${badge.text} rounded-md text-xs font-medium`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500 tabular-nums">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          {order.status === 'pending_payment' && (
                            <button
                              onClick={() => handleCancel(order._id)}
                              disabled={cancellingId === order._id}
                              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.14] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                              {cancellingId === order._id ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500">
                Pagina {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3.5 py-1.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3.5 py-1.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Proxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
