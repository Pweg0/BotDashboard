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

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: 'Pendente',
    className: 'bg-yellow-900/60 text-yellow-400 border-yellow-800',
  },
  paid: {
    label: 'Pago',
    className: 'bg-green-900/60 text-green-400 border-green-800',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-blue-900/60 text-blue-400 border-blue-800',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-900/60 text-red-400 border-red-800',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-orange-900/60 text-orange-400 border-orange-800',
  },
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
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
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
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Pedidos</h1>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStatus === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
          <p className="text-gray-400">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">ID</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Comprador</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Produto</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Qtd</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Valor</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Data</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? {
                    label: order.status,
                    className: 'bg-gray-700 text-gray-400 border-gray-600',
                  };
                  return (
                    <tr key={order._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-gray-200">{order.username}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {order.productSnapshot?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-center">{order.quantity}</td>
                      <td className="px-4 py-3 text-gray-300">
                        R$ {order.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'pending_payment' && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            disabled={cancellingId === order._id}
                            className="px-3 py-1 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Página {page + 1} de {totalPages} &mdash; {total} pedido{total !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
