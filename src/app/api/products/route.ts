import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Product } from '@/lib/models/Product';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const products = await Product.find().sort({ sortOrder: 1, createdAt: -1 });
  return NextResponse.json(products);
}

const ALLOWED_FIELDS = ['name', 'description', 'price', 'imageUrl', 'category', 'stock', 'allowsMultiple', 'sortOrder', 'embedColor'] as const;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();

  const { name, description, price, imageUrl, category } = body;
  if (!name?.trim() || !description?.trim() || price === undefined || price === null || !imageUrl?.trim() || !category?.trim()) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: name, description, price, imageUrl, category' },
      { status: 400 }
    );
  }

  if (typeof price !== 'number' || price <= 0) {
    return NextResponse.json({ error: 'Preço deve ser um número positivo' }, { status: 400 });
  }

  if (body.stock !== undefined && body.stock !== null && (typeof body.stock !== 'number' || body.stock < 0 || !Number.isInteger(body.stock))) {
    return NextResponse.json({ error: 'Estoque deve ser um inteiro não-negativo ou nulo' }, { status: 400 });
  }

  if (body.embedColor !== undefined && (typeof body.embedColor !== 'number' || body.embedColor < 0 || body.embedColor > 0xFFFFFF)) {
    return NextResponse.json({ error: 'Cor do embed inválida' }, { status: 400 });
  }

  // Whitelist allowed fields
  const sanitized: Record<string, unknown> = { status: 'draft' };
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) sanitized[key] = body[key];
  }

  const product = await Product.create(sanitized);
  return NextResponse.json(product, { status: 201 });
}
