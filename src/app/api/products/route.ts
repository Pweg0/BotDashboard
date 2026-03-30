import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();
  const products = await Product.find().sort({ sortOrder: 1, createdAt: -1 });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();

  const body = await request.json();

  const { name, description, price, imageUrl, category } = body;
  if (!name || !description || price === undefined || price === null || !imageUrl || !category) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: name, description, price, imageUrl, category' },
      { status: 400 }
    );
  }

  const product = await Product.create({ ...body, status: 'draft' });
  return NextResponse.json(product, { status: 201 });
}
