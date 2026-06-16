import { NextResponse } from 'next/server';

const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';

interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string[];
  url: string;
}

function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');
  
  let currentChannel: Partial<Channel> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#EXTINF:')) {
      const info = trimmed.slice(8);
      const parts = info.split(' ');
      
      currentChannel = {
        id: '',
        name: '',
        logo: '',
        category: 'General',
        country: [],
        url: '',
      };
      
      for (const part of parts) {
        if (part.startsWith('tvg-id="')) {
          currentChannel.id = part.match(/"([^"]*)"/)?.[1] || '';
        } else if (part.startsWith('tvg-logo="')) {
          currentChannel.logo = part.match(/"([^"]*)"/)?.[1] || '';
        } else if (part.startsWith('group-title="')) {
          const cats = part.match(/"([^"]*)"/)?.[1] || 'General';
          currentChannel.category = cats.split(';')[0];
        } else if (part.includes('(')) {
          const nameMatch = trimmed.match(/,(.+?)\s*\(/);
          if (nameMatch) currentChannel.name = nameMatch[1].trim();
        }
      }
      
      const nameMatch = trimmed.match(/,(.+?)(?:\s*\(|\s*\[|$)/);
      if (nameMatch) currentChannel.name = nameMatch[1].trim();
      
    } else if (trimmed.startsWith('http') && currentChannel.name) {
      currentChannel.url = trimmed;
      if (currentChannel.id === '') currentChannel.id = currentChannel.name;
      
      channels.push(currentChannel as Channel);
      currentChannel = {};
    }
  }
  
  return channels;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(M3U_URL, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });
    
    if (!res.ok) throw new Error('Failed to fetch M3U');
    
    const text = await res.text();
    const channels = parseM3U(text);
    
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}