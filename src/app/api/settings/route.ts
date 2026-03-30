import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { GuildConfig } from '@/lib/models/GuildConfig';

async function requireMaster(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const discordId = (session.user as { discordId?: string }).discordId;
  if (!discordId) {
    return NextResponse.json({ error: 'Discord ID não encontrado' }, { status: 401 });
  }

  await dbConnect();

  const config = await GuildConfig.findOne({ guildId: process.env.DISCORD_GUILD_ID });
  if (!config?.masterUserId || config.masterUserId !== discordId) {
    return NextResponse.json({ error: 'Apenas o usuario master pode acessar configurações' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const denied = await requireMaster();
  if (denied) return denied;

  const config = await GuildConfig.findOne({ guildId: process.env.DISCORD_GUILD_ID });

  return NextResponse.json({
    guildId: config?.guildId ?? '',
    ordersChannelId: config?.ordersChannelId ?? '',
    deliveredChannelId: config?.deliveredChannelId ?? '',
    adminRoleId: config?.adminRoleId ?? '',
    masterUserId: config?.masterUserId ?? '',
  });
}

const ALLOWED_FIELDS = ['ordersChannelId', 'deliveredChannelId', 'adminRoleId', 'masterUserId'] as const;

export async function PATCH(request: NextRequest) {
  const denied = await requireMaster();
  if (denied) return denied;

  const body = await request.json();
  const guildId = process.env.DISCORD_GUILD_ID!;

  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      update[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  const config = await GuildConfig.findOneAndUpdate(
    { guildId },
    update,
    { new: true, upsert: true }
  );

  return NextResponse.json({
    guildId: config.guildId,
    ordersChannelId: config.ordersChannelId ?? '',
    deliveredChannelId: config.deliveredChannelId ?? '',
    adminRoleId: config.adminRoleId ?? '',
    masterUserId: config.masterUserId ?? '',
  });
}
