'use client';

import { useCallback, useEffect, useState } from 'react';

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
    className: 'bg-amber-400/12 text-amber-200',
  },
  paid: {
    label: 'Pago',
    className: 'bg-emerald-400/12 text-emerald-200',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-cyan-400/12 text-cyan-200',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-rose-400/12 text-rose-200',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-orange-400/12 text-orange-200',
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

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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
  const paidCount = orders.filter((order) => order.status === 'paid').length;
  const pendingCount = orders.filter((order) => order.status === 'pending_payment').length;
  const revenue = orders
    .filter((order) => order.status === 'paid' || order.status === 'delivered')
    .reduce((acc, order) => acc + order.amount, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="glass-panel animate-fade-up stagger-1 rounded-[28px] p-6">
          <p className="hud-label mb-3">Orders Flow</p>
          <h1 className="tech-title text-4xl font-semibold text-white">
            Monitoramento financeiro com atmosfera de central tática
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Aqui a ideia é sair da tabela administrativa básica e transformar a visão de pedidos
            em um cockpit: filtros mais visíveis, métricas na entrada e status com leitura imediata.
          </p>
        </div>

        <div className="glass-panel animate-fade-up stagger-2 rounded-[28px] p-6">
          <p className="hud-label mb-3">Design Lens</p>
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-300/18 bg-emerald-400/8 p-4">
              <p className="text-base font-semibold text-white">UX mais operacional</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                O usuário entende em segundos o que está pendente, o que já converteu e onde agir.
              </p>
            </div>
            <button
              onClick={() => fetchOrders(activeStatus, page)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:text-white"
            >
              Recarregar pedidos
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pedidos na página', value: String(orders.length), glow: 'cyan' },
          { label: 'Pendentes', value: String(pendingCount), glow: 'amber' },
          { label: 'Pagos', value: String(paidCount), glow: 'emerald' },
          { label: 'Receita visível', value: formatMoney(revenue), glow: 'violet' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`glass-panel animate-fade-up rounded-[24px] p-5 ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : index === 2 ? 'stagger-3' : 'stagger-4'}`}
          >
            <p className="mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              {item.label}
            </p>
            <p className="tech-title mt-4 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="glass-panel animate-fade-up stagger-2 rounded-[30px] p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="hud-label mb-2">Status Router</p>
            <h2 className="text-xl font-semibold text-white">Filtre o fluxo com mais clareza</h2>
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Página {page + 1} de {totalPages} / {total} registros
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                activeStatus === tab.key
                  ? 'bg-[linear-gradient(135deg,#70d1ff,#29f0b4)] text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/25 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="glass-panel rounded-[24px] border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
        <div className="glass-panel animate-fade-up stagger-3 overflow-hidden rounded-[30px]">
          {loading ? (
            <div className="px-6 py-16 text-center text-slate-400">Sincronizando fluxo de pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-medium text-white">Nenhum pedido encontrado</p>
              <p className="mt-2 text-sm text-slate-400">
                Quando houver atividade, esta área vira a central principal de operação.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['ID', 'Comprador', 'Produto', 'Qtd', 'Valor', 'Status', 'Data', 'Ações'].map(
                        (label) => (
                          <th
                            key={label}
                            className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.24em] text-slate-500"
                          >
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const badge = STATUS_BADGE[order.status] ?? {
                        label: order.status,
                        className: 'bg-white/8 text-slate-300',
                      };

                      return (
                        <tr
                          key={order._id}
                          className="border-b border-white/6 bg-white/[0.01] hover:bg-cyan-400/[0.03]"
                        >
                          <td className="px-6 py-4">
                            <span className="mono rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                              {order._id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{order.username}</p>
                            <p className="mt-1 text-xs text-slate-500">{order.paymentMethod}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {order.productSnapshot?.name ?? '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{order.quantity}</td>
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {formatMoney(order.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {order.status === 'pending_payment' ? (
                              <button
                                onClick={() => handleCancel(order._id)}
                                disabled={cancellingId === order._id}
                                className="rounded-xl bg-rose-400/12 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/20 disabled:opacity-40"
                              >
                                {cancellingId === order._id ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            ) : (
                              <span className="mono text-[11px] uppercase tracking-[0.2em] text-slate-600">
                                Sem ação
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Use este rodapé como zona de navegação rápida sem roubar destaque da tabela.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                    disabled={page === 0}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-panel animate-fade-up stagger-3 rounded-[28px] p-6">
            <p className="hud-label mb-3">O que melhora</p>
            <ul className="space-y-3 text-sm leading-6 text-slate-400">
              <li>Filtro com presença visual mais forte e feedback instantâneo.</li>
              <li>Status legível por cor e shape, não só por texto.</li>
              <li>Rodapé de paginação integrado ao contexto da lista.</li>
              <li>Resumo financeiro sobe para a entrada da tela, onde importa.</li>
            </ul>
          </div>

          <div className="glass-panel animate-fade-up stagger-4 rounded-[28px] p-6">
            <p className="hud-label mb-3">Evoluções possíveis</p>
            <div className="space-y-4">
              {[
                'Timeline visual por pedido com histórico de status',
                'Busca por comprador ou produto',
                'Heatmap simples de horário com mais conversões',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
