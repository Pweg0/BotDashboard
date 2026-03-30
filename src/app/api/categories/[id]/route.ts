import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Category } from '@/lib/models/Category';
import { GuildConfig } from '@/lib/models/GuildConfig';

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.channelId !== undefined) update.channelId = body.channelId.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  const category = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
  }

  // Sync to GuildConfig
  await syncCategoryChannels(category.guildId as string);

  return NextResponse.json(category);
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
  }

  // Sync to GuildConfig
  await syncCategoryChannels(category.guildId as string);

  return NextResponse.json({ success: true });
}

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
