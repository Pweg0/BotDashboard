import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { GuildConfig } from '@/lib/models/GuildConfig';
import { hasAdminRole } from '@/lib/discord';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error('[Dashboard] Auth error:', e);
    return <div className="text-white p-8">Erro de autenticacao. Verifique AUTH_SECRET.</div>;
  }

  if (!session?.user) {
    redirect('/login');
  }

  const discordId = (session.user as { discordId?: string }).discordId;

  if (!discordId) {
    return <div className="text-white p-8">Discord ID nao encontrado na sessao.</div>;
  }

  // Role verification
  let hasRole = false;
  try {
    await dbConnect();
    const config = await GuildConfig.findOne({
      guildId: process.env.DISCORD_GUILD_ID,
    });
    const adminRoleId = config?.adminRoleId as string | undefined;

    if (!adminRoleId) {
      return <div className="text-white p-8">adminRoleId nao configurado. Use /setup cargo-admin no Discord.</div>;
    }

    hasRole = await hasAdminRole(discordId, adminRoleId);
  } catch (e) {
    console.error('[Dashboard] Role check error:', e);
    return <div className="text-white p-8">Erro ao verificar cargo: {String(e)}</div>;
  }

  if (!hasRole) {
    redirect('/login?erro=acesso_negado');
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(112,209,255,0.18),transparent_62%)]" />
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <aside className="glass-panel-strong animate-fade-up m-4 flex w-auto flex-col rounded-[28px] border lg:m-6 lg:min-h-[calc(100vh-3rem)] lg:w-[300px]">
          <div className="border-b border-white/10 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="hud-label mb-2">Control Deck</p>
                <h1 className="tech-title text-2xl font-semibold text-white">MonkeyBot</h1>
              </div>
              <div className="glass-panel animate-glow flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 text-cyan-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3zm0 0v18m7.5-13.5L12 12 4.5 7.5"
                  />
                </svg>
              </div>
            </div>

            <div className="glass-panel grid-overlay neon-ring rounded-3xl p-4">
              <p className="hud-label">Operador</p>
              <p className="mt-2 text-base font-medium text-white">
                {session.user.name ?? session.user.email}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.75)]" />
                <span className="mono text-xs uppercase tracking-[0.24em] text-cyan-100/72">
                  Core Online
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-3 p-4">
            <div className="hud-label px-3">Navigation Matrix</div>
            <Link
              href="/produtos"
              className="group glass-panel flex items-center gap-4 rounded-2xl px-4 py-4 text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/15">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Produtos</span>
                <span className="block text-xs text-slate-400 group-hover:text-cyan-100/75">
                  Catálogo, status e automações
                </span>
              </span>
            </Link>

            <Link
              href="/pedidos"
              className="group glass-panel flex items-center gap-4 rounded-2xl px-4 py-4 text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Pedidos</span>
                <span className="block text-xs text-slate-400 group-hover:text-cyan-100/75">
                  Fluxo financeiro e atendimento
                </span>
              </span>
            </Link>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="glass-panel rounded-2xl p-4">
              <p className="hud-label">Runtime</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Auth
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">Discord</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Mode
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">Admin</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/login' });
                }}
              >
                <button
                  type="submit"
                  className="glass-panel group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-slate-300 hover:border-rose-300/25 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-200 ring-1 ring-rose-300/15">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.7}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-semibold text-white">Encerrar sessão</span>
                      <span className="block text-xs text-slate-400">Logout seguro do painel</span>
                    </span>
                  </span>
                  <span className="mono text-xs uppercase tracking-[0.22em] text-slate-500 group-hover:text-rose-200">
                    Exit
                  </span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="relative flex-1 px-4 pb-6 pt-0 lg:px-0 lg:pb-8 lg:pr-6 lg:pt-6">
          <div className="animate-fade-up stagger-1 mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/4 px-6 py-5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="hud-label mb-2">Admin Interface</p>
              <h2 className="tech-title text-3xl font-semibold text-white">
                Painel com visual tático e foco operacional
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Estrutura pensada para parecer mais premium e tecnológica sem sacrificar leitura,
                densidade de informação e velocidade de uso.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-[290px]">
              <div className="glass-panel rounded-2xl p-4">
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Security
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Role Guard</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Theme
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Neo Control</p>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
