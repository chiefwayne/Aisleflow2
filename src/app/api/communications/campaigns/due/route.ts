import { NextResponse } from 'next/server';
import { processDueCommunicationCampaigns } from '@/app/actions/wedding-actions';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'aisleflow-cron-scheduled-tasks-secret';

    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processDueCommunicationCampaigns();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Due campaigns cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
