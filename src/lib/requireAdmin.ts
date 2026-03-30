import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { GuildConfig } from '@/lib/models/GuildConfig';
import { hasAdminRole } from '@/lib/discord';

/**
 * Validates session + admin role for API routes.
 * Returns null if authorized, or a NextResponse error to return early.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const discordId = (session.user as { discordId?: string }).discordId;
  if (!discordId) {
    return NextResponse.json({ error: 'Discord ID não encontrado na sessão' }, { status: 401 });
  }

  await dbConnect();

  const config = await GuildConfig.findOne({ guildId: process.env.DISCORD_GUILD_ID });
  const adminRoleId = config?.adminRoleId as string | undefined;
  if (!adminRoleId) {
    return NextResponse.json({ error: 'adminRoleId não configurado' }, { status: 403 });
  }

  const authorized = await hasAdminRole(discordId, adminRoleId);
  if (!authorized) {
    return NextResponse.json({ error: 'Acesso negado — cargo de admin necessário' }, { status: 403 });
  }

  return null;
}
