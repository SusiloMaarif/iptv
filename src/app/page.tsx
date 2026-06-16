'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string[];
  url: string;
}

interface Standing {
  IdTeam: string;
  TeamName?: string;
  Team?: any;
  Position: number;
  Played: number;
  Won: number;
  Drawn: number;
  Lost: number;
  For: number;
  Against: number;
  Group?: { Description: string }[];
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('All');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [showWorldCup, setShowWorldCup] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const categories = ['All', 'Sports', 'News', 'Entertainment', 'Kids', 'Music', 'Documentary'];

  useEffect(() => {
    fetchChannels();
    fetchStandings();
  }, []);

  useEffect(() => {
    let filtered = channels;
    if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') filtered = filtered.filter(c => c.category.toLowerCase() === category);
    if (country !== 'All') filtered = filtered.filter(c => c.country.includes(country));
    setFilteredChannels(filtered);
  }, [channels, search, category, country]);

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(data);
      setFilteredChannels(data);
    } catch (e) {
      console.error('Failed to fetch channels:', e);
    }
  };

  const fetchStandings = async () => {
    try {
      const res = await fetch('https://api.fifa.com/api/v3/calendar/17/285023/289273/standing', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = await res.json();
      if (data.Results) setStandings(data.Results);
    } catch (e) {
      console.error('Failed to fetch standings:', e);
    }
  };

  const playChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    if (videoRef.current) {
      if (channel.url.includes('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(channel.url);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play());
          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = channel.url;
        }
      } else {
        videoRef.current.src = channel.url;
        videoRef.current.play();
      }
    }
  };

  const getUniqueCountries = () => {
    const countries = new Set<string>();
    channels.forEach(c => c.country?.forEach(co => countries.add(co)));
    return ['All', ...Array.from(countries).sort()];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#12121a]/95 backdrop-blur border-b border-[#1e1e2e] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
            StreamVault
          </h1>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1e1e2e] border border-[#2e2e3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowWorldCup(!showWorldCup)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-semibold text-sm hover:opacity-90 transition"
          >
            🏆 World Cup
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Filters */}
        <aside className="w-64 p-4 border-r border-[#1e1e2e] hidden lg:block">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Category</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    category === cat ? 'bg-indigo-600 text-white' : 'hover:bg-[#1e1e2e]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Country</h3>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-[#1e1e2e] border border-[#2e2e3e] rounded-lg px-3 py-2 text-sm"
            >
              {getUniqueCountries().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {showWorldCup && (
            <div className="p-4 bg-[#12121a] border-b border-[#1e1e2e]">
              <h2 className="text-lg font-bold mb-4">🏆 FIFA World Cup 2026 Standings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-[#2e2e3e]">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Team</th>
                      <th className="pb-2">P</th>
                      <th className="pb-2">W</th>
                      <th className="pb-2">D</th>
                      <th className="pb-2">L</th>
                      <th className="pb-2">GF</th>
                      <th className="pb-2">GA</th>
                      <th className="pb-2">GD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr key={i} className="border-b border-[#1e1e2e] hover:bg-[#1e1e2e]">
                        <td className="py-2">{s.Position}</td>
                        <td className="py-2">{s.TeamName || s.Team?.name || s.IdTeam}</td>
                        <td className="py-2">{s.Played}</td>
                        <td className="py-2 text-green-400">{s.Won}</td>
                        <td className="py-2 text-yellow-400">{s.Drawn}</td>
                        <td className="py-2 text-red-400">{s.Lost}</td>
                        <td className="py-2">{s.For}</td>
                        <td className="py-2">{s.Against}</td>
                        <td className="py-2">{s.For - s.Against}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {standings.length === 0 && (
                <p className="text-gray-400">Loading standings...</p>
              )}
            </div>
          )}

          {/* Video Player */}
          {currentChannel && (
            <div className="p-4 bg-[#12121a]">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-2">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={currentChannel.logo}
                />
              </div>
              <div className="flex items-center gap-3">
                {currentChannel.logo && (
                  <img src={currentChannel.logo} alt="" className="w-10 h-10 object-contain" />
                )}
                <div>
                  <h3 className="font-semibold">{currentChannel.name}</h3>
                  <p className="text-xs text-gray-400">{currentChannel.category} • {currentChannel.country?.join(', ')}</p>
                </div>
                <button
                  onClick={() => { setCurrentChannel(null); hlsRef.current?.destroy(); }}
                  className="ml-auto px-3 py-1 bg-red-600 rounded-lg text-sm hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Channel Grid */}
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-3">{filteredChannels.length} channels</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => playChannel(channel)}
                  className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3 hover:border-indigo-500 transition group"
                >
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="w-full h-12 object-contain mb-2" />
                  ) : (
                    <div className="w-full h-12 bg-[#1e1e2e] rounded-lg mb-2 flex items-center justify-center text-2xl">
                      📺
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{channel.name}</p>
                  <p className="text-xs text-gray-500 truncate">{channel.country?.join(', ')}</p>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}