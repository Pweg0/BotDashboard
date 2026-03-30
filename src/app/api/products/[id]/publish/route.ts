import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Product } from '@/lib/models/Product';

type Params = Promise<{ id: string }>;

export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const existing = await Product.findById(id);

  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  const newStatus = existing.status === 'draft' ? 'published' : 'draft';
  const product = await Product.findByIdAndUpdate(id, { status: newStatus }, { new: true });

  return NextResponse.json(product);
}
