import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Product } from '@/lib/models/Product';

type Params = Promise<{ id: string }>;

export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await Product.findById(id);

  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  const newStatus = existing.status === 'draft' ? 'published' : 'draft';
  const product = await Product.findByIdAndUpdate(id, { status: newStatus }, { new: true });

  return NextResponse.json(product);
}
