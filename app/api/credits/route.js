import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserCredits, addCredits, getCreditHistory } from '@/utils/credits';

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      const history = await getCreditHistory(session.user.id);
      return NextResponse.json({ history });
    }

    const credits = await getUserCredits(session.user.id);
    return NextResponse.json({ credits });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type = 'purchase', description = '' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const newCredits = await addCredits(
      session.user.id,
      amount,
      type,
      description
    );

    return NextResponse.json({ credits: newCredits });
  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    );
  }
}
