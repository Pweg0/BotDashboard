import Link from 'next/link';
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
    return <div className="text-white p-8">Nao autenticado. <a href="/login" className="underline">Login</a></div>;
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
    return <div className="text-white p-8">Acesso negado. Voce nao tem o cargo de admin no Discord.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">MonkeyBot Admin</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">
            {session.user.name ?? session.user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/produtos"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Produtos
          </Link>
          <Link
            href="/pedidos"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Pedidos
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
