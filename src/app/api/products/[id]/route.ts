import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Product } from '@/lib/models/Product';

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const product = await Product.findById(id);

  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  // Strip protected fields — status managed via /publish, embed fields managed by bot
  const { status: _status, embedMessageId: _embedMessageId, embedChannelId: _embedChannelId, ...updateData } = body;

  const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();
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
