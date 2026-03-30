import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { Order } from '@/lib/models/Order';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const order = await Order.findOneAndUpdate(
    { _id: id, status: 'pending_payment' },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        discordNotified: false,
      },
      $push: {
        statusHistory: { status: 'cancelled', changedAt: new Date() },
      },
    },
    { new: true }
  );

  if (!order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado ou não está pendente' },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
