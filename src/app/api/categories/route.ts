import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Category } from '@/lib/models/Category';
import { GuildConfig } from '@/lib/models/GuildConfig';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const guildId = process.env.DISCORD_GUILD_ID!;
  const categories = await Category.find({ guildId }).sort({ sortOrder: 1, createdAt: 1 });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { name, channelId } = body;

  if (!name?.trim() || !channelId?.trim()) {
    return NextResponse.json({ error: 'Nome e canal são obrigatórios' }, { status: 400 });
  }

  const guildId = process.env.DISCORD_GUILD_ID!;

  // Check duplicate name
  const existing = await Category.findOne({ guildId, name: name.trim() });
  if (existing) {
    return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 });
  }

  const maxOrder = await Category.findOne({ guildId }).sort({ sortOrder: -1 });
  const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

  const category = await Category.create({
    name: name.trim(),
    channelId: channelId.trim(),
    guildId,
    sortOrder,
  });

  // Sync to GuildConfig.categoryChannels so the bot can resolve channels
  await syncCategoryChannels(guildId);

  return NextResponse.json(category, { status: 201 });
}

// PATCH for bulk reorder
export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { order } = body as { order: string[] };

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order deve ser um array de IDs' }, { status: 400 });
  }

  const ops = order.map((id, i) =>
    Category.updateOne({ _id: id }, { sortOrder: i })
  );
  await Promise.all(ops);

  return NextResponse.json({ success: true });
}

// Sync all categories to GuildConfig.categoryChannels map
async function syncCategoryChannels(guildId: string) {
  const categories = await Category.find({ guildId });
  const channelMap: Record<string, string> = {};
  for (const cat of categories) {
    channelMap[cat.name as string] = cat.channelId as string;
  }
  await GuildConfig.findOneAndUpdate(
    { guildId },
    { categoryChannels: channelMap },
    { upsert: true }
  );
}
