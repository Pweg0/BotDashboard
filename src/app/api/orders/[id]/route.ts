import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await dbConnect();

  const { id } = await params;

  const order = await Order.findOneAndUpdate(
    { _id: id, status: 'pending_payment' },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
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
