import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Command, Compass, Heart,
  Layers3, Menu, Moon, Search, ShieldCheck, Sparkles, Sun, Swords, Users, X,
} from 'lucide-react';
import './_group.css';

type CardInfo = {
  id: string;
  name: string;
  setName: string;
  number: string;
  rarity: string;
  price: number;
  trend: number;
  imageUrl: string;
  favorite?: boolean;
};

const sampleCards: CardInfo[] = [
  { id: 'swsh12pt5-60', name: 'Mewtwo VSTAR', setName: 'Crown Zenith', number: 'GG44/GG70', rarity: 'Rare Holo VSTAR', price: 72.48, trend: 8.4, imageUrl: 'https://images.pokemontcg.io/swsh12pt5/60.png' },
  { id: 'sv1-245', name: 'Gardevoir ex', setName: 'Scarlet & Violet', number: '245/198', rarity: 'Special Illustration Rare', price: 34.16, trend: 3.7, imageUrl: 'https://images.pokemontcg.io/sv1/245.png' },
  { id: 'sv3pt5-198', name: 'Venusaur ex', setName: '151', number: '198/165', rarity: 'Special Illustration Rare', price: 47.92, trend: -2.3, imageUrl: 'https://images.pokemontcg.io/sv3pt5/198.png' },
  { id: 'swsh7-215', name: 'Umbreon VMAX', setName: 'Evolving Skies', number: '215/203', rarity: 'Secret Rare', price: 846.35, trend: 5.8, imageUrl: 'https://images.pokemontcg.io/swsh7/215.png', favorite: true },
];
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const pct = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

function Mark({ small = false }: { small?: boolean }) {
  return <span className={`pv-mark ${small ? 'pv-mark-small' : ''}`} aria-hidden="true"><span /><i /><b /></span>;
}

function CardTile({ card, favorite, onFavorite }: { card: CardInfo; favorite: boolean; onFavorite: () => void }) {
  const positive = card.trend >= 0;
  return <article className="pv-card-tile">
    <a href={`/cards/${encodeURIComponent(card.id)}`} className="pv-tile-image-link" aria-label={`View ${card.name}`}>
      <div className="pv-tile-art-wrap">
        <span className="pv-card-serial">{card.number}</span>
        <img className="pv-card-art" src={card.imageUrl} alt={`${card.name} trading card`} loading="lazy" />
        <span className="pv-tile-rarity">{card.rarity}</span>
      </div>
    </a>
    <div className="pv-tile-copy">
      <div className="pv-tile-topline"><span>{card.setName}</span><div className="pv-tile-card-actions">
        <button className={`pv-card-action ${favorite ? 'is-favorite' : ''}`} title={favorite ? 'Remove favorite' : 'Add favorite'} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={onFavorite}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button>
      </div></div>
      <a href={`/cards/${encodeURIComponent(card.id)}`} className="pv-tile-name">{card.name}</a>
      <div className="pv-tile-bottom"><strong>{money(card.price)}</strong><span className={positive ? 'pv-trend-positive' : 'pv-trend-negative'}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{pct(card.trend)}</span></div>
    </div>
  </article>;
}

function SectionHeading({ kicker, title, note, action }: { kicker: string; title: string; note: string; action: ReactNode }) {
  return <div className="pv-section-heading"><div><span className="pv-kicker">{kicker}</span><h2>{title}</h2><p>{note}</p></div>{action}</div>;
}

export function NavyColorRefresh() {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(sampleCards.filter((card) => card.favorite).map((card) => card.id));
  const visibleCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sampleCards;
    return sampleCards.filter((card) => `${card.name} ${card.setName} ${card.number}`.toLowerCase().includes(term));
  }, [search]);
  const toggleFavorite = (id: string) => setFavorites((saved) => saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]);
  const links = [
    { href: '/', text: 'Overview', icon: Compass },
    { href: '/cards', text: 'Card index', icon: Layers3 },
    { href: '/compare', text: 'Trade lab', icon: Swords },
    { href: '/binder', text: 'My binder', icon: BookOpen },
    { href: '/community', text: 'Community', icon: Users },
  ];
  const contentCards = search ? visibleCards : sampleCards;

  return <div className={`pv-refresh ${dark ? 'pv-dark-preview' : ''}`}>
    <div className="pv-shell">
      <aside className={`pv-sidebar ${menuOpen ? 'pv-sidebar-open' : ''}`}>
        <a href="/" className="pv-brand" onClick={() => setMenuOpen(false)}><Mark /><span className="pv-brand-copy"><strong>POKEVAULT</strong><small>INTELLIGENCE</small></span></a>
        <div className="pv-side-kicker">COLLECTOR DESK</div>
        <nav className="pv-side-nav" aria-label="Primary navigation">
          {links.map(({ href, text, icon: Icon }) => <a key={href} href={href} className={`pv-side-link ${href === '/' ? 'pv-side-link-active' : ''}`} onClick={() => setMenuOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{text}</span>{href === '/compare' && <span className="pv-nav-new">LIVE</span>}</a>)}
        </nav>
        <div className="pv-side-spacer" />
        <div className="pv-field-note"><div className="pv-field-note-icon"><ShieldCheck size={18} /></div><div><strong>Collector’s field guide</strong><p>Know what you hold. Trade with clarity.</p></div></div>
        <div className="pv-user"><div className="pv-avatar">G</div><div className="pv-user-label"><strong>Guest collector</strong><small>Browsing mode</small></div></div>
      </aside>
      <div className="pv-mobile-topbar">
        <a href="/" className="pv-brand"><Mark small /><span className="pv-brand-copy"><strong>POKEVAULT</strong><small>INTELLIGENCE</small></span></a>
        <button className="pv-menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
      {menuOpen && <button aria-label="Close navigation overlay" className="pv-mobile-scrim" onClick={() => setMenuOpen(false)} />}
      <main className="pv-main">
        <header className="pv-topbar">
          <div className="pv-breadcrumb"><span>COLLECTOR WORKSPACE</span><span>/</span><span>OVERVIEW</span></div>
          <div className="pv-topbar-right"><span className="pv-market-status"><i />MARKET SIMULATION <b>SIM</b></span><button className="pv-theme-toggle" onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><a className="pv-signin" href="/login">Sign in <ArrowRight size={14} /></a></div>
        </header>
        <div className="pv-page">
          <section className="pv-hero">
            <div className="pv-hero-glows" aria-hidden="true"><span className="pv-glow pv-glow-teal" /><span className="pv-glow pv-glow-coral" /></div>
            <div className="pv-hero-content">
              <div className="pv-eyebrow"><span className="pv-eyebrow-line" />THE COLLECTOR’S FIELD GUIDE <span className="pv-eyebrow-count">VOL. 01</span></div>
              <h1>Every card has<br /><em>a story.</em></h1>
              <p>Know the print. Read the market. Make your next move with confidence.</p>
              <div className="pv-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a Pokémon, set, or card number…" aria-label="Search cards" /><kbd>↵</kbd></div>
              <div className="pv-shortcuts"><span><Command size={12} /> Start with</span>{['Charizard', 'Pikachu', '151'].map((term) => <button key={term} onClick={() => setSearch(term)}>{term}</button>)}</div>
            </div>
            <div className="pv-orbit" aria-hidden="true"><div className="pv-orbit-ring" /><div className="pv-orbit-ring pv-orbit-ring-two" /><div className="pv-orbit-core"><Mark /><span>FIELD<br />NOTES</span></div><div className="pv-orbit-label pv-orbit-label-one">ARCHIVE <b>001—∞</b></div><div className="pv-orbit-label pv-orbit-label-two">TCG / EST. 1996</div><div className="pv-orbit-dot" /></div>
            <div className="pv-hero-index">PV / 01</div>
          </section>
          <section className="pv-market-strip" aria-label="Market summary">
            <div className="pv-market-cell"><span className="pv-stat-label">CARDS TRACKED</span><strong>1,248</strong><small>Across the archive</small></div>
            <div className="pv-market-cell"><span className="pv-stat-label">YOUR BINDER</span><strong>Sign in</strong><small>Build a personal collection</small></div>
            <div className="pv-market-cell"><span className="pv-stat-label">MOVER SENTIMENT</span><strong className="pv-trend-positive">+3.9%</strong><small>Simulated daily average</small></div>
            <div className="pv-market-cell pv-market-updated"><span className="pv-live-mark"><i /> SIMULATED MARKET</span><small>Updated continuously</small></div>
          </section>
          <section className="pv-content-section">
            <SectionHeading kicker={search ? 'SEARCH RESULTS' : 'TOP 10 MOVERS'} title={search ? `Finding “${search}”` : 'Cards on the move'} note={search ? 'Search by Pokémon, set, or card number.' : 'The ten largest simulated percentage moves in the archive.'} action={<a className="pv-text-action" href="/cards">Open card index <ArrowRight size={15} /></a>} />
            {contentCards.length ? <div className="pv-card-grid">{contentCards.slice(0, 4).map((card) => <CardTile key={card.id} card={card} favorite={favorites.includes(card.id)} onFavorite={() => toggleFavorite(card.id)} />)}</div> : <div className="pv-empty">No cards in this pocket. Try another name or card number.</div>}
          </section>
          <section className="pv-below-grid">
            <div className="pv-fact-panel"><div className="pv-fact-head"><span className="pv-fact-symbol"><Sparkles size={18} /></span><span className="pv-stat-label">TODAY’S FIELD NOTE</span><span className="pv-fact-index">NOTE / 014</span></div><p>The first Pokémon TCG set launched in Japan in October 1996, before reaching North America three years later.</p><span className="pv-fact-foot">A LITTLE KNOWLEDGE GOES A LONG WAY</span></div>
            <div className="pv-tool-panel"><div><span className="pv-stat-label">BEFORE YOU TRADE</span><h3>Fair trades<br />start with facts.</h3><p>Put two sides on the table. We’ll do the math.</p><a className="pv-button-warm" href="/compare">Open trade lab <ArrowRight size={15} /></a></div><div className="pv-tool-icon"><Swords size={42} strokeWidth={1.1} /></div></div>
          </section>
          <section className="pv-content-section pv-recent-section">
            <SectionHeading kicker="THE ARCHIVE" title="Find your next favorite" note="Browse the card index, from chase cards to quiet gems." action={<a className="pv-text-action" href="/cards">Explore all cards <ArrowRight size={15} /></a>} />
            <div className="pv-card-grid">{sampleCards.map((card) => <CardTile key={`recent-${card.id}`} card={card} favorite={favorites.includes(card.id)} onFavorite={() => toggleFavorite(card.id)} />)}</div>
          </section>
        </div>
        <footer className="pv-footer"><span>POKEVAULT INTELLIGENCE</span><span>Independent collector toolkit · Values are simulated</span></footer>
      </main>
    </div>
  </div>;
}
