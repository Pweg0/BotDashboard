import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Product } from '@/lib/models/Product';

type Params = Promise<{ id: string }>;

const ALLOWED_FIELDS = ['name', 'description', 'price', 'imageUrl', 'category', 'stock', 'allowsMultiple', 'sortOrder', 'embedColor'] as const;

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const product = await Product.findById(id);

  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  // Whitelist allowed fields only
  const updateData: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  // Validate numeric fields if present
  if (updateData.price !== undefined && (typeof updateData.price !== 'number' || (updateData.price as number) <= 0)) {
    return NextResponse.json({ error: 'Preço deve ser um número positivo' }, { status: 400 });
  }
  if (updateData.stock !== undefined && updateData.stock !== null && (typeof updateData.stock !== 'number' || (updateData.stock as number) < 0 || !Number.isInteger(updateData.stock))) {
    return NextResponse.json({ error: 'Estoque deve ser um inteiro não-negativo ou nulo' }, { status: 400 });
  }
  if (updateData.embedColor !== undefined && (typeof updateData.embedColor !== 'number' || (updateData.embedColor as number) < 0 || (updateData.embedColor as number) > 0xFFFFFF)) {
    return NextResponse.json({ error: 'Cor do embed inválida' }, { status: 400 });
  }

  const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const product = await Product.findById(id);

  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  if (product.embedMessageId) {
    // Soft-delete: product has an active Discord embed that the panel cannot remove directly.
    // Setting status to 'draft' triggers the panelPoller (runs every 30s) to call
    // deleteProductEmbed() and clear embedMessageId/embedChannelId automatically.
    // The product remains as a reusable draft after the embed is cleaned up.
    await Product.updateOne({ _id: product._id }, { status: 'draft' });
    return NextResponse.json({ success: true, softDeleted: true });
  }

  // Hard-delete: no active embed, safe to remove from DB immediately.
  await Product.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
