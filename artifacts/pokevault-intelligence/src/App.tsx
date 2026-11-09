import { createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute } from 'wouter';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen,
  Bookmark, Check, ChevronDown, CircleHelp, Clock3, Command, Compass, Download, Eye, EyeOff, Gem, Heart,
  Layers3, LogIn, LogOut, Menu, Minus, Moon, Plus, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Swords, Users, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BinderEntry, BinderEntryInputCondition, Card, CommunityBinder, PublicBinderSummary, getGetBinderSettingsQueryKey,
  getGetCardNoteQueryKey, getGetCardQueryKey, getGetCommunityBinderQueryKey, getGetDashboardQueryKey, getGetSessionQueryKey, getHealthCheckQueryKey, getListBinderEntriesQueryKey,
  getListPublicBindersQueryKey,
  getListCardsQueryKey, ListCardsParams, useAddFavorite, useCreateBinderEntry,
  useDeleteBinderEntry, useGetBinderSettings, useGetCard, useGetCardNote, useGetCommunityBinder, useGetDashboard, useGetSession,
  useListBinderEntries, useListCards, useListPublicBinders, useLogin, useLogout, useRegister,
  useRemoveFavorite, useSaveCardNote, useUpdateBinderEntry, useHealthCheck,
  useUpdateBinderSettings,
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 20_000 } } });
const cookieRequest = { credentials: 'include' as const };
const conditions = Object.values(BinderEntryInputCondition);
const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => undefined });
const money = (value?: number) => typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—';
const pct = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const failureMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

function Mark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-hidden="true"><span /><i /><b /></span>;
}

function Button({ children, onClick, variant = 'solid', className = '', type = 'button', disabled = false }: {
  children: ReactNode; onClick?: () => void; variant?: 'solid' | 'outline' | 'ghost' | 'warm' | 'danger'; className?: string; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`button button-${variant} ${className}`}>{children}</button>;
}

function AppFrame({ children, user }: { children: ReactNode; user: { username: string } | null }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { dark, toggle } = useContext(ThemeContext);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false }, request: cookieRequest });
  const logout = useLogout({ request: cookieRequest, mutation: { onSuccess: () => {
    queryClient.removeQueries();
    queryClient.setQueryData(getGetSessionQueryKey(), { user: null });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    toast.success('Signed out. Your private vault is locked.');
  } } });
  const links = [
    { href: '/', text: 'Overview', icon: Compass },
    { href: '/cards', text: 'Card index', icon: Layers3 },
    { href: '/compare', text: 'Trade lab', icon: Swords },
    { href: '/binder', text: 'My binder', icon: BookOpen },
    { href: '/community', text: 'Community', icon: Users },
  ];
  return <div className="app-shell app-grain">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand-lockup" onClick={() => setMenuOpen(false)}><Mark /><span><strong>POKEVAULT</strong><small>INTELLIGENCE</small></span></Link>
      <div className="side-kicker">COLLECTOR DESK</div>
      <nav className="side-nav" aria-label="Primary navigation">
        {links.map(({ href, text, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${text.toLowerCase().replaceAll(' ', '-')}`} className={`side-link ${location === href || (href === '/cards' && location.startsWith('/cards/')) || (href === '/community' && location.startsWith('/community/')) ? 'side-link-active' : ''}`} onClick={() => setMenuOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{text}</span>{href === '/compare' && <span className="nav-new">LIVE</span>}</Link>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="field-note"><div className="field-note-icon"><ShieldCheck size={18} /></div><div><strong>Collector’s field guide</strong><p>Know what you hold. Trade with clarity.</p></div></div>
      <div className="side-user">
        <div className="avatar">{user?.username?.slice(0, 1).toUpperCase() ?? 'G'}</div>
        <div className="user-label"><strong>{user?.username ?? 'Guest collector'}</strong><small>{user ? 'Vault member' : 'Browsing mode'}</small></div>
        {user ? <button className="icon-button side-logout" aria-label="Sign out" data-testid="button-logout" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={16} /></button> : <Link href="/login" aria-label="Sign in" className="icon-button side-logout" data-testid="link-login"><LogIn size={16} /></Link>}
      </div>
    </aside>
    <div className="mobile-topbar">
      <Link href="/" className="brand-lockup"><Mark small /><span><strong>POKEVAULT</strong><small>INTELLIGENCE</small></span></Link>
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    {menuOpen && <button aria-label="Close navigation overlay" className="mobile-scrim" onClick={() => setMenuOpen(false)} />}
    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb"><span>COLLECTOR WORKSPACE</span><span className="breadcrumb-dot">/</span><span>{location === '/' ? 'OVERVIEW' : location.split('/')[1]?.toUpperCase()}</span></div>
        <div className="topbar-right"><span className="market-status"><i className={health.isError ? 'status-offline' : ''} />{health.isError ? 'API STATUS' : 'MARKET SIMULATION'} <b>{health.isLoading ? '…' : health.isError ? 'CHECK' : 'SIM'}</b></span><button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>{user ? <span className="top-user"><span className="avatar avatar-small">{user.username.slice(0, 1).toUpperCase()}</span>{user.username}</span> : <Link className="top-signin" href="/login">Sign in <ArrowRight size={14} /></Link>}</div>
      </header>
      <div className="page-container page-enter">{children}</div>
      <footer className="app-footer"><span>POKEVAULT INTELLIGENCE</span><span>Independent collector toolkit · Values are simulated</span></footer>
    </main>
  </div>;
}

function QueryError({ error, retry }: { error: unknown; retry: () => void }) {
  return <div className="error-panel" role="alert"><CircleHelp size={20} /><div><strong>Couldn’t load this view</strong><p>{failureMessage(error)}</p><button className="text-action" onClick={retry}>Try again <ArrowRight size={14} /></button></div></div>;
}

function SkeletonGrid() {
  return <div className="card-grid">{[1, 2, 3, 4].map((n) => <div className="card-skeleton" key={n}><div className="skeleton skeleton-art" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>)}</div>;
}

function CardTile({ card, user, onFavorite }: { card: Card; user: { username: string } | null; onFavorite?: (card: Card) => void }) {
  return <article className="card-tile" data-testid={`card-catalog-${card.id}`}>
    <Link href={`/cards/${encodeURIComponent(card.id)}`} className="tile-image-link" aria-label={`View ${card.name}`}>
      <div className="tile-art-wrap"><span className="card-serial">{card.number}</span><img className="card-art" src={card.imageUrl} alt={`${card.name} trading card`} loading="lazy" /><span className="tile-rarity">{card.rarity}</span></div>
    </Link>
    <div className="tile-copy">
      <div className="tile-topline"><span>{card.setName}</span><button className={`favorite-button ${card.isFavorite ? 'is-favorite' : ''}`} title={user ? card.isFavorite ? 'Remove favorite' : 'Add favorite' : 'Sign in to save favorites'} aria-label={card.isFavorite ? 'Remove from favorites' : 'Add to favorites'} data-testid={`button-favorite-${card.id}`} onClick={() => onFavorite?.(card)}><Heart size={16} fill={card.isFavorite ? 'currentColor' : 'none'} /></button></div>
      <Link href={`/cards/${encodeURIComponent(card.id)}`} className="tile-name">{card.name}</Link>
      <div className="tile-bottom"><strong>{money(card.marketPrice)}</strong><span className={card.trendPercent >= 0 ? 'trend-positive' : 'trend-negative'}>{card.trendPercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{pct(card.trendPercent)}</span></div>
    </div>
  </article>;
}

function CatalogGrid({ cards, user, onFavorite }: { cards: Card[]; user: { username: string } | null; onFavorite: (card: Card) => void }) {
  if (!cards.length) return <div className="empty-state"><div className="empty-icon"><Search /></div><h3>No cards in this pocket</h3><p>Try a different name or loosen your filters to keep exploring.</p></div>;
  return <div className="card-grid">{cards.map((card) => <CardTile key={card.id} card={card} user={user} onFavorite={onFavorite} />)}</div>;
}

function useFavoriteAction(user: { username: string } | null) {
  const [, setLocation] = useLocation();
  const cache = useQueryClient();
  const refresh = (cardId: string) => {
    cache.invalidateQueries({ queryKey: getListCardsQueryKey() });
    cache.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
    cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };
  const add = useAddFavorite({ request: cookieRequest, mutation: { onSuccess: (_result, variables) => { refresh(variables.cardId); toast.success('Added to your favorites.'); }, onError: (error) => toast.error(failureMessage(error)) } });
  const remove = useRemoveFavorite({ request: cookieRequest, mutation: { onSuccess: (_result, variables) => { refresh(variables.cardId); toast.success('Removed from your favorites.'); }, onError: (error) => toast.error(failureMessage(error)) } });
  return (card: Card) => {
    if (!user) { setLocation('/login'); return; }
    (card.isFavorite ? remove : add).mutate({ cardId: card.id });
  };
}

function HomePage({ user }: { user: { username: string } | null }) {
  const [search, setSearch] = useState('');
  const query = useListCards(search ? { search } : undefined, { request: cookieRequest });
  const dashboard = useGetDashboard({ request: cookieRequest });
  const favorites = useFavoriteAction(user);
  const cards = query.data ?? [];
  const movers = dashboard.data?.movers ?? [];
  const trendValue = movers.reduce((total, card) => total + card.trendPercent, 0) / (movers.length || 1);
  return <div className="home-page">
    <section className="hero-panel">
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-line" />THE COLLECTOR’S FIELD GUIDE <span className="eyebrow-count">VOL. 01</span></div>
        <h1>Every card has<br /><em>a story.</em></h1>
        <p>Know the print. Read the market. Make your next move with confidence.</p>
        <div className="hero-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a Pokémon, set, or card number…" aria-label="Search cards" data-testid="input-home-search" /><kbd>↵</kbd></div>
        <div className="hero-shortcuts"><span><Command size={12} /> Start with</span>{['Charizard', 'Pikachu', '151'].map((term) => <button key={term} onClick={() => setSearch(term)}>{term}</button>)}</div>
      </div>
      <div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Mark /><span>FIELD<br />NOTES</span></div><div className="orbit-label orbit-label-one">ARCHIVE <b>001—∞</b></div><div className="orbit-label orbit-label-two">TCG / EST. 1996</div><div className="orbit-dot" /></div>
      <div className="hero-index">PV / 01</div>
    </section>
    <section className="market-strip" aria-label="Market summary">
      <div className="market-cell"><span className="stat-label">CARDS TRACKED</span><strong>{dashboard.isLoading ? '—' : (cards.length || 'Catalog').toString()}</strong><small>Across the archive</small></div>
      <div className="market-cell"><span className="stat-label">YOUR BINDER</span><strong>{user ? dashboard.data?.binderCount ?? '—' : 'Sign in'}</strong><small>{user ? `${money(dashboard.data?.binderValue)} estimated` : 'Build a personal collection'}</small></div>
      <div className="market-cell"><span className="stat-label">MOVER SENTIMENT</span><strong className={trendValue >= 0 ? 'trend-positive' : 'trend-negative'}>{dashboard.isLoading ? '—' : pct(trendValue)}</strong><small>Simulated daily average</small></div>
      <div className="market-cell market-updated"><span className="live-mark"><i /> SIMULATED MARKET</span><small>Updated continuously</small></div>
    </section>
    <section className="content-section">
      <SectionHeading kicker={search ? 'SEARCH RESULTS' : 'TOP 10 MOVERS'} title={search ? `Finding “${search}”` : 'Cards on the move'} note={search ? 'Search by Pokémon, set, or card number.' : 'The ten largest simulated percentage moves in the archive.'} action={<Link className="text-action" href="/cards">Open card index <ArrowRight size={15} /></Link>} />
      {query.isLoading ? <SkeletonGrid /> : query.isError ? <QueryError error={query.error} retry={() => query.refetch()} /> : <CatalogGrid cards={search ? cards.slice(0, 10) : movers.slice(0, 10)} user={user} onFavorite={favorites} />}
    </section>
    <section className="below-grid">
      <div className="fact-panel"><div className="fact-head"><span className="fact-symbol"><Sparkles size={18} /></span><span className="stat-label">TODAY’S FIELD NOTE</span><span className="fact-index">NOTE / 014</span></div><p>{dashboard.data?.dailyFact ?? (dashboard.isLoading ? 'Gathering today’s collector intelligence…' : 'Every card tells a story. Start with the details, and the value follows.')}</p><span className="fact-foot">A LITTLE KNOWLEDGE GOES A LONG WAY</span></div>
      <div className="tool-panel"><div><span className="stat-label">BEFORE YOU TRADE</span><h3>Fair trades<br />start with facts.</h3><p>Put two sides on the table. We’ll do the math.</p><Link className="button button-warm" href="/compare">Open trade lab <ArrowRight size={15} /></Link></div><div className="tool-icon"><Swords size={42} strokeWidth={1.1} /></div></div>
    </section>
    <section className="content-section recent-section"><SectionHeading kicker="THE ARCHIVE" title="Find your next favorite" note="Browse the card index, from chase cards to quiet gems." action={<Link className="text-action" href="/cards">Explore all cards <ArrowRight size={15} /></Link>} />
      {query.isLoading ? <SkeletonGrid /> : query.isError ? <QueryError error={query.error} retry={() => query.refetch()} /> : <CatalogGrid cards={cards.slice(0, 4)} user={user} onFavorite={favorites} />}
    </section>
  </div>;
}

function SectionHeading({ kicker, title, note, action }: { kicker: string; title: string; note: string; action?: ReactNode }) {
  return <div className="section-heading"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2><p>{note}</p></div>{action}</div>;
}

function MultiFilter({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <details className="multi-filter">
    <summary aria-label={`Filter by ${label.toLowerCase()}`}>{label}{selected.length > 0 && <span className="multi-filter-count">{selected.length}</span>}<ChevronDown size={14} /></summary>
    <div className="multi-filter-menu">{options.map((option) => <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} /><span>{option}</span></label>)}</div>
  </details>;
}

function exportBinderCsv(entries: BinderEntry[]) {
  const rows = [
    ['Card', 'Set', 'Card number', 'Condition', 'Quantity', 'Simulated market price', 'Simulated total value', 'Notes'],
    ...entries.map((entry) => [
      entry.card.name,
      entry.card.setName,
      entry.card.number,
      entry.condition,
      String(entry.quantity),
      entry.card.marketPrice.toFixed(2),
      entry.totalValue.toFixed(2),
      entry.notes,
    ]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `pokevault-binder-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  toast.success('Binder exported as CSV.');
}

function CardsPage({ user }: { user: { username: string } | null }) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [setFilter, setSetFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const toggleOption = (selected: string[], update: (values: string[]) => void, value: string) => update(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  const params: ListCardsParams = useMemo(() => ({ ...(search ? { search } : {}), sort, ...(setFilter.length ? { sets: setFilter } : {}), ...(typeFilter.length ? { types: typeFilter } : {}), ...(rarityFilter.length ? { rarities: rarityFilter } : {}), ...(favoritesOnly ? { favoritesOnly: true } : {}) }), [search, sort, setFilter, typeFilter, rarityFilter, favoritesOnly]);
  const result = useListCards(params, { request: cookieRequest });
  const filters = useListCards(undefined, { request: cookieRequest });
  const favorites = useFavoriteAction(user);
  const sets = Array.from(new Set((filters.data ?? []).map((card) => card.setName))).sort();
  const types = Array.from(new Set((filters.data ?? []).map((card) => card.type))).sort();
  const rarities = Array.from(new Set((filters.data ?? []).map((card) => card.rarity))).sort();
  return <section className="catalog-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />THE ARCHIVE</div><h1>Card index<span className="title-period">.</span></h1><p>Search the collection. Get to know every print.</p></div><div className="index-stamp"><Layers3 size={17} /> INDEX<br /><b>001 / ∞</b></div></div>
    <div className="catalog-controls">
      <label className="search-control"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, set, or number" aria-label="Search catalog" data-testid="input-catalog-search" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</label>
      <label className="select-control"><SlidersHorizontal size={15} /><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort cards" data-testid="select-card-sort"><option value="name">Name, A–Z</option><option value="price_desc">Highest value</option><option value="price_asc">Lowest value</option></select><ChevronDown size={14} /></label>
      <MultiFilter label="Set" options={sets} selected={setFilter} onToggle={(value) => toggleOption(setFilter, setSetFilter, value)} />
      <MultiFilter label="Type" options={types} selected={typeFilter} onToggle={(value) => toggleOption(typeFilter, setTypeFilter, value)} />
      <MultiFilter label="Rarity" options={rarities} selected={rarityFilter} onToggle={(value) => toggleOption(rarityFilter, setRarityFilter, value)} />
      <button className={`filter-toggle ${favoritesOnly ? 'filter-active' : ''}`} onClick={() => user ? setFavoritesOnly(!favoritesOnly) : setLocation('/login')} data-testid="button-favorites-filter"><Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites</button>
      <span className="results-count">{result.data?.length ?? '—'} RECORDS</span>
    </div>
    {result.isLoading ? <SkeletonGrid /> : result.isError ? <QueryError error={result.error} retry={() => result.refetch()} /> : <CatalogGrid cards={result.data ?? []} user={user} onFavorite={favorites} />}
  </section>;
}

function DetailPage({ user }: { user: { username: string } | null }) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/cards/:cardId');
  const cardId = params?.cardId ?? '';
  const cardQuery = useGetCard(cardId, { request: cookieRequest });
  const noteQuery = useGetCardNote(cardId, { query: { enabled: !!user && !!cardId, queryKey: getGetCardNoteQueryKey(cardId) }, request: cookieRequest });
  const card = cardQuery.data;
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [showAuthenticationTip, setShowAuthenticationTip] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [condition, setCondition] = useState<string>(BinderEntryInputCondition.Near_Mint);
  const [quantity, setQuantity] = useState(1);
  const [binderNote, setBinderNote] = useState('');
  const cache = useQueryClient();
  const favorites = useFavoriteAction(user);
  const saveNote = useSaveCardNote({ request: cookieRequest, mutation: { onSuccess: (result) => { cache.setQueryData(getGetCardNoteQueryKey(cardId), result); setSaved(true); window.setTimeout(() => setSaved(false), 2200); } } });
  const addBinder = useCreateBinderEntry({ request: cookieRequest, mutation: { onSuccess: () => { cache.invalidateQueries({ queryKey: getListBinderEntriesQueryKey() }); cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setAddOpen(false); toast.success('Card added to your binder.'); } } });
  useEffect(() => { setNote(noteQuery.data?.note ?? ''); }, [noteQuery.data?.note, cardId]);
  if (cardQuery.isLoading) return <div className="detail-loading"><div className="skeleton skeleton-detail-art" /><div><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div></div>;
  if (cardQuery.isError || !card) return <QueryError error={cardQuery.error} retry={() => cardQuery.refetch()} />;
  const history = card.history ?? [];
  const max = Math.max(...history.map((point) => point.value), 1);
  const min = Math.min(...history.map((point) => point.value), 0);
  const graphPoints = history.map((point, index) => `${history.length <= 1 ? 50 : 5 + index * (90 / (history.length - 1))},${95 - ((point.value - min) / (max - min || 1)) * 82}`).join(' ');
  const addToBinder = (event: FormEvent) => { event.preventDefault(); if (!user) return; addBinder.mutate({ data: { cardId, condition: condition as BinderEntryInputCondition, quantity: Math.max(1, quantity), notes: binderNote } }); };
  return <div className="detail-page">
    <Link href="/cards" className="back-link"><ArrowLeft size={15} /> Back to the index</Link>
    <div className="detail-main">
      <div className="detail-art-frame"><div className="detail-art-top"><span>POKEVAULT / CARD RECORD</span><span>{card.setId} · {card.number}</span></div><img src={card.imageUrl} alt={`${card.name} Pokémon card`} /><div className="detail-art-caption">COLLECTOR’S REFERENCE <b>{card.year}</b></div></div>
      <div className="detail-copy">
        <div className="detail-eyebrow"><span>{card.setName}</span><span className="rarity-chip"><Gem size={12} /> {card.rarity}</span></div>
        <h1>{card.name}<span className="title-period">.</span></h1>
        <div className="detail-meta"><span>{card.type} type</span><i /> <span>Illustrated by {card.artist}</span></div>
        <div className="detail-price"><div><span className="stat-label">SIMULATED MARKET VALUE</span><strong>{money(card.marketPrice)}</strong></div><span className={`price-change ${card.trendPercent >= 0 ? 'trend-positive' : 'trend-negative'}`}>{card.trendPercent >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{pct(card.trendPercent)} <small>today</small></span></div>
        <div className="detail-actions"><Button variant="warm" onClick={() => user ? setAddOpen(true) : setLocation('/login')}><Plus size={16} /> Add to binder</Button><Button variant="outline" onClick={() => favorites(card)}><Heart size={16} fill={card.isFavorite ? 'currentColor' : 'none'} /> {card.isFavorite ? 'Saved' : 'Save card'}</Button></div>
        <div className="card-facts"><div><span>CARD NUMBER</span><b>{card.number}</b></div><div><span>SET</span><b>{card.setName}</b></div><div><span>PRINT YEAR</span><b>{card.year}</b></div><div><span>TYPE</span><b>{card.type}</b></div></div>
        {card.tags?.length > 0 && <div className="tag-row">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </div>
    </div>
    <div className="detail-lower">
      <section className="chart-panel"><div className="panel-heading"><div><span className="section-kicker">30-DAY SIMULATED HISTORY</span><h2>Recent movement</h2></div><span className="sim-label"><i /> SIMULATED</span></div>
        {history.length ? <><div className="chart-current"><strong>{money(history[history.length - 1]?.value)}</strong><span>latest record</span></div><svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Card price movement chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".22" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><polygon points={`5,100 ${graphPoints} 95,100`} fill="url(#chartFill)" /><polyline points={graphPoints} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg><div className="chart-dates"><span>{history[0]?.day}</span><span>{history[history.length - 1]?.day}</span></div></> : <div className="chart-empty">No price history is available for this card yet.</div>}
      </section>
      <section className="auth-panel"><span className="section-kicker"><BadgeCheck size={13} /> AUTHENTICATION NOTES</span><h2>Look closer.</h2>{showAuthenticationTip ? <p>{card.authenticationTip || 'Compare the print details, surface texture, and edge alignment against a trusted reference.'}</p> : <div className="spoiler-cover"><p>Era-specific print and texture guidance is tucked away until you want to reveal it.</p><button className="text-action" onClick={() => setShowAuthenticationTip(true)}>Reveal authentication tip <ArrowRight size={14} /></button></div>}<div className="auth-foot"><ShieldCheck size={16} /><span>Reference tip, not a formal grade</span></div></section>
    </div>
    <section className="note-section"><div className="note-heading"><div><span className="section-kicker">PRIVATE FIELD NOTES</span><h2>Your observations</h2></div><span className="private-label"><Bookmark size={13} /> PRIVATE</span></div>
      {user ? <><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Condition notes, trade context, or the story behind this card…" maxLength={2000} aria-label="Private card notes" data-testid="input-card-note" /><div className="note-footer"><span>{note.length} / 2,000</span><Button onClick={() => saveNote.mutate({ cardId, data: { note } })} disabled={saveNote.isPending}>{saved ? <><Check size={15} /> Saved</> : saveNote.isPending ? 'Saving…' : 'Save note'}</Button></div>{saveNote.isError && <p className="inline-error">{failureMessage(saveNote.error)}</p>}</> : <div className="note-locked"><p>Sign in to keep private notes attached to this card.</p><Link href="/login" className="text-action">Sign in to continue <ArrowRight size={14} /></Link></div>}
    </section>
    {card.relatedCards?.length > 0 && <section className="related-section"><SectionHeading kicker="SAME NEIGHBORHOOD" title="Related cards" note="Keep following the thread." /><CatalogGrid cards={card.relatedCards} user={user} onFavorite={favorites} /></section>}
    {addOpen && <Modal title={`Add ${card.name} to your binder`} onClose={() => setAddOpen(false)}><form className="modal-form" onSubmit={addToBinder}><label>Condition<select value={condition} onChange={(e) => setCondition(e.target.value)}>{conditions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Quantity<div className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><input value={quantity} type="number" min="1" onChange={(e) => setQuantity(Number(e.target.value))} /><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div></label><label>Private note<textarea value={binderNote} maxLength={1000} onChange={(e) => setBinderNote(e.target.value)} placeholder="Optional details about this copy" /></label>{addBinder.isError && <p className="inline-error">{failureMessage(addBinder.error)}</p>}<Button type="submit" disabled={addBinder.isPending}>{addBinder.isPending ? 'Adding…' : 'Add to my binder'}</Button></form></Modal>}
  </div>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="section-kicker">COLLECTOR WORKSPACE</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>{children}</div></div>;
}

function BinderPage({ user }: { user: { username: string } | null }) {
  const query = useListBinderEntries({ query: { enabled: !!user, queryKey: getListBinderEntriesQueryKey() }, request: cookieRequest });
  const settingsQuery = useGetBinderSettings({ query: { enabled: !!user, queryKey: getGetBinderSettingsQueryKey() }, request: cookieRequest });
  const entries = query.data ?? [];
  const [editing, setEditing] = useState<BinderEntry | null>(null);
  const [editCondition, setEditCondition] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [removing, setRemoving] = useState<BinderEntry | null>(null);
  const cache = useQueryClient();
  const sharing = useUpdateBinderSettings({ request: cookieRequest, mutation: { onSuccess: (settings) => {
    cache.setQueryData(getGetBinderSettingsQueryKey(), settings);
    cache.invalidateQueries({ queryKey: getListPublicBindersQueryKey() });
    cache.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && (query.queryKey[0] === '/api/community' || query.queryKey[0].startsWith('/api/community/')) });
    cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    toast.success(settings.isPublic ? 'Your binder is now visible in the community.' : 'Your binder is private again.');
  }, onError: (error) => toast.error(failureMessage(error)) } });
  const update = useUpdateBinderEntry({ request: cookieRequest, mutation: { onSuccess: () => { cache.invalidateQueries({ queryKey: getListBinderEntriesQueryKey() }); cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setEditing(null); toast.success('Binder entry updated.'); } } });
  const remove = useDeleteBinderEntry({ request: cookieRequest, mutation: { onSuccess: () => { cache.invalidateQueries({ queryKey: getListBinderEntriesQueryKey() }); cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setRemoving(null); toast.success('Card removed from your binder.'); } } });
  if (!user) return <div className="binder-gate"><div className="gate-mark"><BookOpen size={25} /></div><span className="section-kicker">YOUR PRIVATE COLLECTION</span><h1>A place for<br /><em>the keepers.</em></h1><p>Sign in to catalog your cards, track your collection’s simulated value, and keep the details close.</p><Link href="/login" className="button button-warm">Sign in to your vault <ArrowRight size={16} /></Link><span className="gate-foot">Your binder is private to your account.</span></div>;
  if (query.isLoading) return <div className="page-loading"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><SkeletonGrid /></div>;
  if (query.isError) return <QueryError error={query.error} retry={() => query.refetch()} />;
  const total = entries.reduce((sum, entry) => sum + entry.totalValue, 0);
  const settings = settingsQuery.data ?? { isPublic: false, hideValue: false };
  const updateSharing = (patch: Partial<typeof settings>) => sharing.mutate({ data: { isPublic: patch.isPublic ?? settings.isPublic, hideValue: patch.hideValue ?? settings.hideValue } });
  const editEntry = (entry: BinderEntry) => { setEditing(entry); setEditCondition(entry.condition); setEditQuantity(entry.quantity); setEditNotes(entry.notes); };
  return <div className="binder-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />YOUR COLLECTION / PRIVATE</div><h1>The binder<span className="title-period">.</span></h1><p>Every copy, carefully accounted for.</p></div><div className="binder-actions"><button className="button button-outline" onClick={() => exportBinderCsv(entries)} disabled={!entries.length}><Download size={15} /> Export CSV</button><Link href="/cards" className="button button-warm"><Plus size={16} /> Add cards</Link></div></div>
    <div className="binder-summary"><div><span className="stat-label">TOTAL COPIES</span><strong>{entries.reduce((sum, entry) => sum + entry.quantity, 0)}</strong><small>{entries.length} unique {entries.length === 1 ? 'card' : 'cards'}</small></div><div><span className="stat-label">SIMULATED VALUE</span><strong>{money(total)}</strong><small>Based on current market trace</small></div><div className="binder-summary-note"><Layers3 size={21} /><p>Condition matters. Keep each copy’s details current for a clearer picture.</p></div></div>
    <section className="sharing-panel" aria-labelledby="sharing-title">
      <div className="sharing-intro"><div className="sharing-emblem">{settings.isPublic ? <Eye size={20} /> : <ShieldCheck size={20} />}</div><div><span className="section-kicker">YOUR PRIVACY, YOUR CALL</span><h2 id="sharing-title">Share with care.</h2><p>{settings.isPublic ? 'Your binder appears in Community Binders. Your private notes never leave your vault.' : 'Your binder is private by default. Choose what other collectors can see.'}</p></div></div>
      <div className="sharing-controls">
        <label className="sharing-option"><span className="sharing-option-icon">{settings.isPublic ? <Eye size={16} /> : <ShieldCheck size={16} />}</span><span className="sharing-option-copy"><strong>Public binder</strong><small>Show your card list in Community Binders. Notes are never shared.</small></span><input type="checkbox" role="switch" aria-label="Make binder public" data-testid="switch-binder-public" checked={settings.isPublic} disabled={sharing.isPending || settingsQuery.isLoading} onChange={(event) => updateSharing({ isPublic: event.target.checked })} /><i className="switch-track" /></label>
        <label className={`sharing-option ${!settings.isPublic ? 'sharing-option-muted' : ''}`}><span className="sharing-option-icon">{settings.hideValue ? <EyeOff size={16} /> : <Eye size={16} />}</span><span className="sharing-option-copy"><strong>Hide collection value</strong><small>{settings.hideValue ? 'Visitors see your cards and counts, but not an aggregate value.' : 'Visitors can see the aggregate simulated value.'}</small></span><input type="checkbox" role="switch" aria-label="Hide aggregate collection value" data-testid="switch-binder-hide-value" checked={settings.hideValue} disabled={sharing.isPending || settingsQuery.isLoading || !settings.isPublic} onChange={(event) => updateSharing({ hideValue: event.target.checked })} /><i className="switch-track" /></label>
      </div>
      <div className="sharing-foot"><span className={`privacy-status ${settings.isPublic ? 'privacy-status-public' : ''}`}><i />{settings.isPublic ? 'VISIBLE TO THE COMMUNITY' : 'PRIVATE TO YOUR ACCOUNT'}</span>{settingsQuery.isError && <span className="inline-error">Sharing settings unavailable. <button className="text-action" onClick={() => settingsQuery.refetch()}>Retry</button></span>}{sharing.isPending && <span className="sharing-saving">Saving your preferences…</span>}</div>
    </section>
    {!entries.length ? <div className="empty-state binder-empty"><div className="empty-icon"><BookOpen /></div><span className="section-kicker">FIRST PAGE, BLANK</span><h3>Your collection starts with one.</h3><p>Find a card you love and add it here. We’ll keep its value and condition in view.</p><Link href="/cards" className="button button-solid">Browse the card index <ArrowRight size={15} /></Link></div> :
      <div className="binder-list"><div className="binder-list-heading"><span>CARD / SET</span><span>CONDITION</span><span>QTY.</span><span>EST. VALUE</span><span>TOOLS</span></div>{entries.map((entry) => <article className="binder-row" key={entry.id} data-testid={`binder-entry-${entry.id}`}><Link href={`/cards/${encodeURIComponent(entry.cardId)}`} className="binder-card"><img src={entry.card.imageUrl} alt="" /><span><strong>{entry.card.name}</strong><small>{entry.card.setName} · {entry.card.number}</small></span></Link><span className="condition-pill">{entry.condition}</span><span className="binder-qty">{entry.quantity}</span><strong className="binder-value">{money(entry.totalValue)}</strong><div className="row-actions"><button className="icon-button" onClick={() => editEntry(entry)} aria-label={`Edit ${entry.card.name}`} data-testid={`button-edit-entry-${entry.id}`}><SlidersHorizontal size={15} /></button><button className="icon-button danger-icon" onClick={() => setRemoving(entry)} aria-label={`Remove ${entry.card.name}`} data-testid={`button-remove-entry-${entry.id}`}><X size={16} /></button></div>{entry.notes && <p className="binder-note"><Bookmark size={12} /> {entry.notes}</p>}</article>)}</div>}
    {editing && <Modal title={`Edit ${editing.card.name}`} onClose={() => setEditing(null)}><form className="modal-form" onSubmit={(e) => { e.preventDefault(); update.mutate({ entryId: editing.id, data: { condition: editCondition as BinderEntryInputCondition, quantity: Math.max(1, editQuantity), notes: editNotes } }); }}><label>Condition<select value={editCondition} onChange={(e) => setEditCondition(e.target.value)}>{conditions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Quantity<input type="number" min="1" value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} /></label><label>Notes<textarea maxLength={1000} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></label>{update.isError && <p className="inline-error">{failureMessage(update.error)}</p>}<Button type="submit" disabled={update.isPending}>{update.isPending ? 'Updating…' : 'Save changes'}</Button></form></Modal>}
    {removing && <Modal title="Remove this copy?" onClose={() => setRemoving(null)}><p className="confirm-copy">This will remove <strong>{removing.card.name}</strong> from your binder. This action can’t be undone.</p>{remove.isError && <p className="inline-error">{failureMessage(remove.error)}</p>}<div className="modal-actions"><Button variant="outline" onClick={() => setRemoving(null)}>Keep card</Button><Button variant="danger" onClick={() => remove.mutate({ entryId: removing.id })} disabled={remove.isPending}>{remove.isPending ? 'Removing…' : 'Remove copy'}</Button></div></Modal>}
  </div>;
}

function CommunityPage() {
  const [search, setSearch] = useState('');
  const directory = useListPublicBinders({ query: { queryKey: getListPublicBindersQueryKey() }, request: cookieRequest });
  const binders = (directory.data ?? []).filter((binder) => binder.username.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="community-page">
    <section className="community-hero">
      <div className="community-hero-copy"><span className="eyebrow"><span className="eyebrow-line" />THE COLLECTOR COMMONS</span><h1>Good collections<br /><em>find each other.</em></h1><p>A considered look at the binders collectors choose to share. Every collection here is public by choice.</p><div className="community-hero-meta"><span><Users size={14} /> OPEN TO EVERY COLLECTOR</span><span><ShieldCheck size={14} /> NOTES STAY PRIVATE</span></div></div>
      <div className="community-orbit" aria-hidden="true"><div className="community-orbit-ring ring-a" /><div className="community-orbit-ring ring-b" /><div className="community-orbit-core"><BookOpen size={26} /><span>SHARED<br />ARCHIVE</span></div><i className="orbit-token token-one" /><i className="orbit-token token-two" /><span className="orbit-caption">COLLECT / CONNECT</span></div>
    </section>
    <section className="community-browse"><div className="community-heading"><div><span className="section-kicker">PUBLIC BINDERS</span><h2>From their shelves.</h2><p>Browse by collector. Open a binder to see the cards, never the private notes.</p></div><label className="community-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a collector…" aria-label="Search public binders" data-testid="input-community-search" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}</label></div>
      {directory.isLoading ? <div className="community-directory">{[0,1,2].map((item) => <div className="community-skeleton" key={item}><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton community-skeleton-art" /></div>)}</div> : directory.isError ? <QueryError error={directory.error} retry={() => directory.refetch()} /> : !binders.length ? <div className="community-empty"><div className="empty-icon"><Users /></div><span className="section-kicker">{search ? 'NO MATCHES YET' : 'A QUIET COMMONS'}</span><h3>{search ? 'No collector by that name.' : 'The shelves are waiting.'}</h3><p>{search ? 'Try another username or clear your search.' : 'When collectors choose to share a public binder, you’ll find it here.'}</p>{search && <button className="text-action" onClick={() => setSearch('')}>Clear search <ArrowRight size={14} /></button>}</div> : <div className="community-directory">{binders.map((binder, index) => <CommunitySummaryCard key={binder.userId} binder={binder} index={index} />)}</div>}
      <div className="community-boundary"><ShieldCheck size={17} /><span><strong>A clear boundary.</strong> Only binders their owners have made public appear here. Card notes and personal details are never included.</span><Link href="/binder">Set your sharing preferences <ArrowRight size={14} /></Link></div>
    </section>
  </div>;
}

function CommunitySummaryCard({ binder, index }: { binder: PublicBinderSummary; index: number }) {
  return <Link href={`/community/${binder.userId}`} className="community-person-card" data-testid={`link-community-binder-${binder.userId}`}>
    <div className={`community-card-art community-art-${index % 3}`}><span className="community-card-index">COLLECTOR / {String(index + 1).padStart(2, '0')}</span><BookOpen size={31} strokeWidth={1.15} /><span className="community-card-seal"><Eye size={13} /> PUBLIC</span></div>
    <div className="community-person-info"><div className="community-avatar">{binder.username.slice(0,1).toUpperCase()}</div><div className="community-person-name"><strong>{binder.username}</strong><small>COLLECTOR’S BINDER</small></div><ArrowUpRight size={17} className="community-card-arrow" /></div>
    <div className="community-stats"><div><strong>{binder.cardCount}</strong><small>CARDS</small></div><div><strong>{binder.uniqueCardCount}</strong><small>UNIQUE</small></div><div><strong>{binder.hideValue ? 'Private' : 'Shared'}</strong><small>VALUE</small></div></div>
  </Link>;
}

function CommunityBinderPage() {
  const [, params] = useRoute('/community/:userId');
  const rawUserId = params?.userId ?? '';
  const userId = /^\d+$/.test(rawUserId) ? Number(rawUserId) : -1;
  const query = useGetCommunityBinder(userId, { query: { enabled: userId > 0, queryKey: getGetCommunityBinderQueryKey(userId) }, request: cookieRequest });
  if (userId < 1) return <div className="community-empty community-invalid"><div className="empty-icon"><CircleHelp /></div><h3>That collector isn’t in the archive.</h3><Link href="/community" className="text-action">Return to the commons <ArrowRight size={14} /></Link></div>;
  if (query.isLoading) return <div className="community-detail-loading"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><SkeletonGrid /></div>;
  if (query.isError || !query.data) return <div className="community-error"><QueryError error={query.error} retry={() => query.refetch()} /><Link href="/community" className="text-action"><ArrowLeft size={14} /> Back to Community Binders</Link></div>;
  return <CommunityBinderView binder={query.data} />;
}

function CommunityBinderView({ binder }: { binder: CommunityBinder }) {
  const profile = binder.profile;
  return <div className="community-public-binder">
    <Link href="/community" className="back-link"><ArrowLeft size={15} /> Community Binders</Link>
    <section className="public-binder-banner"><div className="public-binder-avatar">{profile.username.slice(0,1).toUpperCase()}</div><div className="public-binder-identity"><span className="section-kicker"><Eye size={12} /> PUBLIC COLLECTION</span><h1>{profile.username}<span className="title-period">.</span></h1><p>A collector’s shelf, shared by choice.</p></div><div className="public-binder-value"><span className="stat-label">{profile.hideValue ? 'VALUE HIDDEN BY COLLECTOR' : 'SIMULATED PORTFOLIO VALUE'}</span><strong>{profile.hideValue || binder.portfolioValue === null ? 'Not shared' : money(binder.portfolioValue)}</strong><small>{profile.cardCount} copies · {profile.uniqueCardCount} unique cards</small></div></section>
    <div className="public-binder-note"><ShieldCheck size={16} /><span>This is a read-only view. Private notes and owner controls are never shown.</span></div>
    <section className="public-card-section"><div className="public-card-heading"><div><span className="section-kicker">THE COLLECTION</span><h2>Cards on this shelf.</h2></div><span>{binder.entries.length} {binder.entries.length === 1 ? 'ENTRY' : 'ENTRIES'}</span></div>
      {binder.entries.length ? <div className="public-card-grid">{binder.entries.map((entry) => <article className="public-card" key={`${entry.cardId}-${entry.condition}`} data-testid={`community-card-${entry.cardId}`}><Link href={`/cards/${encodeURIComponent(entry.cardId)}`} className="public-card-image"><img src={entry.card.imageUrl} alt={`${entry.card.name} trading card`} loading="lazy" /><span>{entry.card.number}</span></Link><div className="public-card-copy"><span className="public-card-set">{entry.card.setName}</span><Link href={`/cards/${encodeURIComponent(entry.cardId)}`} className="public-card-name">{entry.card.name}</Link><div className="public-card-meta"><span>{entry.condition}</span><span>QTY. {entry.quantity}</span></div></div></article>)}</div> : <div className="community-empty"><div className="empty-icon"><BookOpen /></div><h3>This shelf is between chapters.</h3><p>The collector has shared a binder, but there are no cards to display just yet.</p></div>}
    </section>
  </div>;
}

function ComparePage({ user }: { user: { username: string } | null }) {
  const [queryText, setQueryText] = useState('');
  const cardsQuery = useListCards(queryText ? { search: queryText } : undefined, { request: cookieRequest });
  const cards = cardsQuery.data ?? [];
  const [left, setLeft] = useState<Card[]>([]);
  const [right, setRight] = useState<Card[]>([]);
  const leftValue = left.reduce((sum, card) => sum + card.marketPrice, 0);
  const rightValue = right.reduce((sum, card) => sum + card.marketPrice, 0);
  const spread = Math.abs(leftValue - rightValue);
  const delta = leftValue + rightValue === 0 ? 0 : (spread / Math.max(leftValue, rightValue)) * 100;
  const addCard = (setter: (update: (current: Card[]) => Card[]) => void) => (card: Card) =>
    setter((current) => current.some((item) => item.id === card.id) ? current : [...current, card]);
  return <div className="compare-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />THE TRADE LAB</div><h1>Fair is a feeling.<br /><em>Facts are better.</em></h1><p>Compare simulated market values before the handshake.</p></div><div className="compare-stamp"><Swords size={20} /><span>TRADE<br />CHECK / 01</span></div></div>
    {!user && <div className="inline-banner"><ShieldCheck size={17} /><span>Trading is open to everyone. <Link href="/login">Sign in</Link> to save the cards you collect.</span></div>}
    {cardsQuery.isError ? <QueryError error={cardsQuery.error} retry={() => cardsQuery.refetch()} /> : <div className="trade-board">
      <TradeSide title="YOUR SIDE" value={left} cards={cards} search={queryText} setSearch={setQueryText} onPick={addCard(setLeft)} onRemove={(id) => setLeft((current) => current.filter((card) => card.id !== id))} onClear={() => setLeft([])} />
      <div className="trade-middle"><div className="versus">VS</div><div className="balance-line" /><span>VALUE<br />CHECK</span></div>
      <TradeSide title="THEIR SIDE" value={right} cards={cards} search={queryText} setSearch={setQueryText} onPick={addCard(setRight)} onRemove={(id) => setRight((current) => current.filter((card) => card.id !== id))} onClear={() => setRight([])} />
    </div>}
    {left.length > 0 && right.length > 0 && <div className={`fairness-result ${delta > 25 ? 'fairness-caution' : ''}`}><div className="fairness-icon">{delta <= 10 ? <BadgeCheck size={22} /> : <Activity size={22} />}</div><div className="fairness-copy"><span className="section-kicker">{delta <= 10 ? 'FAIR TRADE' : delta <= 25 ? 'ONE-SIDED' : 'BAD TRADE'}</span><h2>{delta <= 10 ? 'Looks balanced.' : `A ${money(spread)} difference.`}</h2><p>{delta <= 10 ? 'The total simulated values are within 10%, so this looks fair by the estimate.' : `${leftValue > rightValue ? 'Your side' : 'Their side'} leads by ${pct(delta)} of the higher-value side. ${delta <= 25 ? 'This trade is one-sided by the estimate.' : 'This is a significant value gap; consider adjusting before trading.'}`}</p></div><div className="fairness-total"><span>VALUE DELTA</span><strong>{money(spread)}</strong><small>{pct(delta)} of higher side</small></div></div>}
    <div className="trade-disclaimer"><Clock3 size={14} /> Values are estimates from a simulated market trace, not a price guarantee or grading opinion.</div>
    <section className="trade-guide"><div className="trade-guide-icon"><ShieldCheck size={20} /></div><div><span className="section-kicker">A QUICK REMINDER</span><h3>Condition changes the conversation.</h3><p>Centering, surface wear, corners, and authenticity can move a card’s real-world value well beyond this estimate. Inspect both sides before you trade.</p></div></section>
  </div>;
}

function TradeSide({ title, value, cards, search, setSearch, onPick, onRemove, onClear }: { title: string; value: Card[]; cards: Card[]; search: string; setSearch: (text: string) => void; onPick: (card: Card) => void; onRemove: (id: string) => void; onClear: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return <section className="trade-side"><div className="trade-side-head"><span className="section-kicker">{title}</span>{value.length > 0 && <button className="text-action" onClick={onClear}><X size={14} /> Clear</button>}</div>
    {value.length > 0 && <div className="trade-picked-list">{value.map((card) => <div className="trade-picked" key={card.id}><img src={card.imageUrl} alt="" /><div><strong>{card.name}</strong><small>{card.setName} · {card.number}</small><span className="trade-value">{money(card.marketPrice)}</span></div><button className="icon-button" aria-label={`Remove ${card.name} from trade`} onClick={() => onRemove(card.id)}><X size={15} /></button></div>)}</div>}
    <button className="trade-picker" onClick={() => setExpanded(!expanded)}><span className="picker-plus"><Plus size={20} /></span><span><strong>{value.length ? 'Add another card' : 'Choose cards'}</strong><small>Search the catalog to add cards to this side</small></span><ChevronDown size={16} className={expanded ? 'rotate-chevron' : ''} /></button>{expanded && <div className="trade-picker-panel"><label className="search-control"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a card…" aria-label={`Search card for ${title}`} /></label><div className="picker-results">{cards.filter((card) => !value.some((item) => item.id === card.id)).slice(0, 8).map((card) => <button key={card.id} onClick={() => onPick(card)}><img src={card.imageUrl} alt="" /><span><strong>{card.name}</strong><small>{card.setName}</small></span><b>{money(card.marketPrice)}</b></button>)}{!cards.length && <p className="picker-empty">No matching cards. Try a different search.</p>}</div></div>}
    <div className="trade-side-footer"><span>SIMULATED MARKET VALUE</span><strong>{money(value.reduce((sum, card) => sum + card.marketPrice, 0))}</strong></div>
  </section>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [, setLocation] = useLocation();
  const cache = useQueryClient();
  const isRegister = mode === 'register';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const onSignedIn = (session: { user: { id: number; username: string } }) => {
    cache.setQueryData(getGetSessionQueryKey(), session);
    cache.invalidateQueries({ queryKey: getListCardsQueryKey() });
    cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    toast.success('Your collector vault is ready.');
    setLocation('/');
  };
  const login = useLogin({ request: cookieRequest, mutation: { onSuccess: onSignedIn } });
  const register = useRegister({ request: cookieRequest, mutation: { onSuccess: onSignedIn } });
  const pending = login.isPending || register.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault(); setErrorText('');
    if (isRegister && username.length < 3) { setErrorText('Choose a username with at least 3 characters.'); return; }
    if (username.length > 24) { setErrorText('Usernames can be up to 24 characters.'); return; }
    if (password.length < (isRegister ? 8 : 1)) { setErrorText('Use a password with at least 8 characters.'); return; }
    const onError = (error: unknown) => setErrorText(failureMessage(error));
    if (isRegister) register.mutate({ data: { username, password } }, { onError });
    else login.mutate({ data: { username, password } }, { onError });
  };
  return <div className="auth-page">
    <div className="auth-art"><Link href="/" className="brand-lockup auth-brand"><Mark /><span><strong>POKEVAULT</strong><small>INTELLIGENCE</small></span></Link><div className="auth-orbit"><div className="auth-ring" /><div className="auth-ring auth-ring-inner" /><div className="auth-orb"><Mark /></div><span className="orbit-word word-a">ARCHIVE / OPEN</span><span className="orbit-word word-b">COLLECT WITH CLARITY</span></div><div className="auth-art-copy"><span className="section-kicker">A BETTER WAY TO COLLECT</span><h2>Keep your<br /><em>story close.</em></h2><p>Build a vault that knows what you know.</p></div><span className="auth-art-foot">POKEVAULT INTELLIGENCE · FIELD GUIDE SERIES</span></div>
    <div className="auth-form-wrap"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to the workspace</Link><div className="auth-form-card"><div className="auth-card-icon">{isRegister ? <Sparkles size={20} /> : <ShieldCheck size={20} />}</div><span className="section-kicker">{isRegister ? 'START YOUR COLLECTION' : 'WELCOME BACK, COLLECTOR'}</span><h1>{isRegister ? 'Open your vault.' : 'Return to your vault.'}</h1><p>{isRegister ? 'Your cards, notes, and trade research in one private place.' : 'Your binder and field notes are right where you left them.'}</p><form className="auth-form" onSubmit={submit}><label>Username<input autoComplete="username" minLength={isRegister ? 3 : 1} maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your collector name" required data-testid="input-username" /></label><label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : 1} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required data-testid="input-password" /></label>{errorText && <p className="auth-error" role="alert">{errorText}</p>}<Button type="submit" disabled={pending} className="auth-submit">{pending ? isRegister ? 'Creating your vault…' : 'Opening your vault…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></Button></form><div className="auth-switch">{isRegister ? 'Already have a vault?' : 'New to PokeVault?'} <Link href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></div><div className="auth-privacy"><ShieldCheck size={14} /> Your collection stays private to your account.</div></div></div>
  </div>;
}

function RouteView({ user }: { user: { username: string } | null }) {
  const [location] = useLocation();
  const authRoute = location === '/login' || location === '/register';
  return authRoute ? <Switch><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route></Switch> : <AppFrame user={user}><Switch>
    <Route path="/" component={() => <HomePage user={user} />} />
    <Route path="/cards" component={() => <CardsPage user={user} />} />
    <Route path="/cards/:cardId" component={() => <DetailPage user={user} />} />
    <Route path="/compare" component={() => <ComparePage user={user} />} />
    <Route path="/binder" component={() => <BinderPage user={user} />} />
    <Route path="/community" component={CommunityPage} />
    <Route path="/community/:userId" component={CommunityBinderPage} />
    <Route component={NotFound} />
  </Switch></AppFrame>;
}

function SessionRouter() {
  const session = useGetSession({ query: { queryKey: getGetSessionQueryKey(), retry: false }, request: cookieRequest });
  const user = session.data?.user ?? null;
  return <RouteView user={user} />;
}

function App() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('pokevault-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    window.localStorage.setItem('pokevault-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const theme = useMemo(() => ({ dark, toggle: () => setDark((current) => !current) }), [dark]);
  return <QueryClientProvider client={queryClient}><TooltipProvider><ThemeContext.Provider value={theme}><ErrorBoundary><SessionRouter /></ErrorBoundary><Toaster /></ThemeContext.Provider></TooltipProvider></QueryClientProvider>;
}

export default App;
