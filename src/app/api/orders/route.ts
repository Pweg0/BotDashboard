import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Order } from '@/lib/models/Order';

const VALID_STATUSES = ['pending_payment', 'paid', 'delivered', 'cancelled', 'expired'];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));

  const filter: Record<string, string> = {};
  if (status && VALID_STATUSES.includes(status)) {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}
