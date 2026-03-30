import { signIn } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasError = params.erro === 'acesso_negado';

  return (
    <div className="min-h-screen bg-[#0c0e14] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/[0.07] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[400px] animate-in">
        {/* Card */}
        <div className="bg-[#11131a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">MonkeyBot Admin</h1>
            <p className="text-sm text-zinc-500">Painel administrativo do servidor</p>
          </div>

          {hasError && (
            <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-sm text-center">
                Voce nao tem permissao para acessar o painel. Verifique se possui o cargo de admin no servidor.
              </p>
            </div>
          )}

          <form
            action={async () => {
              'use server';
              await signIn('discord', { redirectTo: '/produtos' });
            }}
          >
            <button
              type="submit"
              className="w-full bg-[#5865F2] hover:bg-[#4752c4] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.111 18.1.12 18.12a19.898 19.898 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Entrar com Discord
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-zinc-600">
          Apenas membros com cargo de admin podem acessar.
        </p>
      </div>
    </div>
  );
}
