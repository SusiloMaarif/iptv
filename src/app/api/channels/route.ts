import { NextResponse } from 'next/server';
import { POPULAR_CHANNELS } from '@/lib/channels';

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
      currentChannel = { id: '', name: '', logo: '', category: 'General', country: [], url: '' };
      
      const parts = trimmed.slice(8).split(' ');
      for (const part of parts) {
        if (part.startsWith('tvg-id="')) currentChannel.id = part.match(/"([^"]*)"/)?.[1] || '';
        else if (part.startsWith('tvg-logo="')) currentChannel.logo = part.match(/"([^"]*)"/)?.[1] || '';
        else if (part.startsWith('group-title="')) currentChannel.category = part.match(/"([^"]*)"/)?.[1]?.split(';')[0] || 'General';
      }
      
      const nameMatch = trimmed.match(/,(.+?)(?:\s*\(|\s*\[|$)/);
      if (nameMatch) currentChannel.name = nameMatch[1].trim();
      
    } else if (trimmed.startsWith('http') && currentChannel.name) {
      currentChannel.url = trimmed;
      if (!currentChannel.id) currentChannel.id = currentChannel.name;
      channels.push(currentChannel as Channel);
      currentChannel = {};
    }
  }
  
  return channels;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'WORLD';
    
    // Check cache first
    const cacheKey = `channels_${country}`;
    const cached = await fetch(`https://iptv-org.github.io/iptv/index.m3u`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
    });
    
    if (!cached.ok) throw new Error('Failed to fetch');
    
    const text = await cached.text();
    let channels = parseM3U(text);
    
    // Filter by curated popular channels
    const popularNames = new Set(
      Object.values(POPULAR_CHANNELS).flat().map(n => n.toLowerCase())
    );
    
    // For WORLD, show only channels that match popular list OR have good signals
    if (country === 'WORLD') {
      channels = channels.filter(ch => {
        const nameLower = ch.name.toLowerCase();
        return popularNames.has(nameLower) || 
               (ch.logo && ch.category !== 'Undefined' && popularNames.size > 0);
      }).slice(0, 2000);
    } else {
      // Filter by country-specific popular list
      const countryList = POPULAR_CHANNELS[country];
      if (countryList) {
        channels = channels.filter(ch => {
          const nameLower = ch.name.toLowerCase();
          return countryList.some(p => nameLower.includes(p.toLowerCase()));
        });
      }
    }
    
    // Dedupe by name
    const seen = new Set();
    channels = channels.filter(ch => {
      const key = ch.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return NextResponse.json({ channels, count: channels.length });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels', channels: [] }, { status: 500 });
  }
}