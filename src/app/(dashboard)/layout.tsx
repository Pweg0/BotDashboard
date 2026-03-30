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
    <div className="min-h-screen bg-[#0c0e14] flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#11131a] border-r border-white/[0.06] flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white">MonkeyBot</h1>
              <p className="text-[11px] text-zinc-500 font-medium">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-xs font-semibold text-zinc-400">
                {(session.user.name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {session.user.name ?? session.user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Menu</p>
          <Link
            href="/produtos"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
          >
            <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[13px] font-medium">Produtos</span>
          </Link>
          <Link
            href="/pedidos"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
          >
            <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[13px] font-medium">Pedidos</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[13px] font-medium">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[260px] p-8 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
