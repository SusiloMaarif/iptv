import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://iptv-org.github.io/iptv/channels.json', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'StreamVault/1.0' },
    });
    
    if (!res.ok) throw new Error('Failed to fetch');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}