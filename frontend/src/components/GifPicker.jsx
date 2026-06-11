import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const TENOR_KEY = import.meta.env.VITE_TENOR_API_KEY;

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGifs = async (q) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = q
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=24&media_filter=tinygif,gif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=24&media_filter=tinygif,gif`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Tenor API error");
      const data = await res.json();
      setGifs(data.results || []);
    } catch (err) {
      setError("Could not load GIFs. Make sure VITE_TENOR_API_KEY is set in frontend/.env");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs("");
  }, []);

  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => fetchGifs(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="gif-picker">
      <div className="gif-search">
        <Search size={14} className="search-icon" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs (e.g. happy, party, sad)..."
          className="search-input"
        />
      </div>
      <div className="gif-grid">
        {loading && <div className="empty-state-mini">Loading GIFs...</div>}
        {error && <div className="empty-state-mini error">{error}</div>}
        {!loading && !error && gifs.map((g) => {
          const src = g.media_formats?.tinygif?.url || g.media_formats?.gif?.url;
          const full = g.media_formats?.gif?.url;
          if (!src) return null;
          return (
            <img
              key={g.id}
              src={src}
              alt={g.content_description}
              className="gif-thumb"
              onClick={() => { onSelect(full || src); onClose(); }}
            />
          );
        })}
      </div>
    </div>
  );
}
