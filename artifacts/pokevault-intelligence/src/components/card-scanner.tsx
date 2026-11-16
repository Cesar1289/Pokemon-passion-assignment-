import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, ImagePlus, Search, ShieldCheck, X } from 'lucide-react';
import { getGetCardQueryKey, getListCardsQueryKey, useGetCard, useListCards } from '@workspace/api-client-react';
import type { Card } from '@workspace/api-client-react';

const cookieRequest = { credentials: 'include' as const };
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function hashCardId(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gradingMultiplier(card: Card) {
  if (card.year <= 2007 && /holo/i.test(card.rarity)) return 8;
  const price = Math.max(card.marketPrice, 0);
  if (price <= 1) return 3;
  if (price <= 10) return 4;
  if (price <= 50) return 5;
  if (price <= 200) return 6;
  return 7;
}

function simulatedPopulations(id: string) {
  const seed = hashCardId(id);
  const psa10 = 18 + (seed % 1643);
  return {
    psa10,
    psa9: psa10 + 15 + ((seed >>> 8) % 2870),
  };
}

function ScannerCardImage({ card, alt }: { card: Card; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const hasArtwork = failedSource !== card.imageUrl && card.imageUrl !== '/artwork-unavailable.svg';
  return <img
    src={hasArtwork ? card.imageUrl : '/artwork-unavailable.svg'}
    alt={hasArtwork ? alt : alt ? `${alt} — artwork unavailable` : ''}
    onError={() => { if (hasArtwork) setFailedSource(card.imageUrl); }}
  />;
}

function CardScannerResult({ card }: { card: Card }) {
  const detailQuery = useGetCard(card.id, {
    query: { enabled: !!card.id, queryKey: getGetCardQueryKey(card.id) },
    request: cookieRequest,
  });
  const detail = detailQuery.data;
  const multiplier = gradingMultiplier(card);
  const gradedPrice = card.marketPrice * multiplier;
  const premium = gradedPrice - card.marketPrice;
  const populations = simulatedPopulations(card.id);
  const history = detail?.history ?? [];
  const chart = useMemo(() => {
    if (!history.length) return '';
    const values = history.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return history.map((point, index) => {
      const x = history.length === 1 ? 50 : 4 + (index / (history.length - 1)) * 92;
      const y = 36 - ((point.value - min) / (max - min || 1)) * 28;
      return `${x},${y}`;
    }).join(' ');
  }, [history]);

  return <div className="scanner-result" data-testid="scanner-result">
    <div className="scanner-result-card">
      <ScannerCardImage card={card} alt={`${card.name} card artwork`} />
      <div>
        <span className="scanner-overline">{card.setName} · {card.year}</span>
        <h3>{card.name}</h3>
        <p>{card.rarity} · {card.id}</p>
      </div>
    </div>
    <div className="scanner-price-grid">
      <div className="scanner-price-cell">
        <span>Current catalog quote · simulated</span>
        <strong>{money(card.marketPrice)}</strong>
        <small>Raw, ungraded catalog value</small>
      </div>
      <div className="scanner-price-cell scanner-price-highlight">
        <span>Estimated PSA 10 · simulated</span>
        <strong>{money(gradedPrice)}</strong>
        <small>{multiplier.toFixed(1)}× simulated grading multiplier</small>
      </div>
    </div>
    <div className="scanner-premium" role="status" data-testid="status-simulated-premium">
      <span><Check size={15} /> Grading could add {money(premium)} · simulated</span>
      <small>Simulated premium, before grading fees</small>
    </div>
    <div className="scanner-population" data-testid="text-simulated-populations">
      <div><span>PSA 10 population · simulated</span><strong>{populations.psa10.toLocaleString()}</strong></div>
      <div><span>PSA 9 population · simulated</span><strong>{populations.psa9.toLocaleString()}</strong></div>
    </div>
    <section className="scanner-history" aria-label="Simulated 30-day price history">
      <div className="scanner-history-heading"><div><span>PRICE RECORD</span><strong>30-day history</strong></div><small>Simulated historical points</small></div>
      {detailQuery.isLoading ? <div className="scanner-chart-skeleton" aria-label="Loading price history" /> : detailQuery.isError
        ? <div className="scanner-inline-error" role="alert"><AlertTriangle size={15} /> History could not be loaded. Try again later.</div>
        : history.length > 0 ? <>
          <svg className="scanner-chart" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label={`${history.length} simulated historical price points`}>
            <line x1="4" y1="38" x2="96" y2="38" />
            <polyline points={chart} />
          </svg>
          <div className="scanner-history-ends"><span>{history[0]?.day}</span><span>{history[history.length - 1]?.day}</span></div>
        </> : <p className="scanner-history-empty">No historical points are available for this card.</p>}
      <p className="scanner-history-note">Historical points are separate from today’s catalog quote above.</p>
    </section>
  </div>;
}

export function CardScannerEntry({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'viewfinder' | 'match' | 'result'>('viewfinder');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardsQuery = useListCards(search.trim() ? { search: search.trim() } : undefined, {
    query: { enabled: open && step === 'match', queryKey: getListCardsQueryKey(search.trim() ? { search: search.trim() } : undefined) },
    request: cookieRequest,
  });

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!open) return;
    setStep('viewfinder');
    setSearch('');
    setSelectedCard(null);
    setCameraError('');
    setCameraUnavailable(false);
    closeRef.current?.focus();
    let cancelled = false;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraUnavailable(true);
        setCameraError('Camera access is unavailable in this browser. Choose an image from your device instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) {
          setCameraUnavailable(true);
          setCameraError('Camera permission was denied or the camera is unavailable. You can choose a local image instead.');
        }
      }
    };
    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeScanner();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const closeScanner = () => {
    setOpen(false);
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const simulateScan = () => {
    stopCamera();
    setStep('match');
    setCameraError('');
  };

  const onImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setCameraError('Image stays on this device and is not uploaded. Scan recognition is simulated; choose a catalog match to continue.');
    stopCamera();
  };

  return <>
    <button className={`scanner-entry ${compact ? 'scanner-entry-compact' : ''}`} type="button" onClick={() => setOpen(true)} data-testid="button-open-card-scanner">
      <Camera size={16} /> <span>Scan a card</span>
    </button>
    {open && createPortal(<div className="scanner-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeScanner(); }}>
      <section className="scanner-dialog" role="dialog" aria-modal="true" aria-labelledby="scanner-title" data-testid="dialog-card-scanner">
        <header className="scanner-dialog-header">
          <div><span className="scanner-overline">POKEVAULT / FIELD TOOL</span><h2 id="scanner-title">{step === 'result' ? 'Scan estimate' : 'Card scanner'}</h2></div>
          <button className="scanner-icon-button" ref={closeRef} type="button" aria-label="Close card scanner" onClick={closeScanner} data-testid="button-close-card-scanner"><X size={18} /></button>
        </header>
        <div className="scanner-stepper" aria-label="Scanner progress">
          <span className={step === 'viewfinder' ? 'active' : ''}>01 Viewfinder</span><i />
          <span className={step === 'match' ? 'active' : ''}>02 Manual match</span><i />
          <span className={step === 'result' ? 'active' : ''}>03 Estimate</span>
        </div>
        {step === 'viewfinder' && <div className="scanner-view-step">
          <div className={`scanner-viewfinder ${cameraUnavailable ? 'scanner-viewfinder-fallback' : ''}`}>
            {previewUrl ? <img className="scanner-local-preview" src={previewUrl} alt="Selected local card image preview" /> : <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera viewfinder" />}
            {!previewUrl && !cameraUnavailable && <div className="scanner-card-frame" aria-hidden="true"><span /><span /><span /><span /></div>}
            {cameraUnavailable && !previewUrl && <div className="scanner-camera-state"><Camera size={28} /><strong>Viewfinder unavailable</strong><span>Use a local card photo or continue with a simulated scan.</span></div>}
            <span className="scanner-view-label"><i /> {previewUrl ? 'LOCAL PREVIEW' : cameraUnavailable ? 'CAMERA OFFLINE' : 'LIVE VIEWFINDER'}</span>
          </div>
          {cameraError && <p className="scanner-camera-message" role="status"><AlertTriangle size={15} />{cameraError}</p>}
          <p className="scanner-help">Center a single card in the frame. No image is sent or stored.</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelected} className="scanner-file-input" aria-label="Choose card image from device" data-testid="input-scanner-image" />
          <div className="scanner-actions">
            <button type="button" className="scanner-secondary-button" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-scanner-image"><ImagePlus size={16} /> Choose image</button>
            <button type="button" className="scanner-primary-button" onClick={simulateScan} data-testid="button-simulate-scan"><Camera size={16} /> Simulate scan <ArrowRight size={15} /></button>
          </div>
        </div>}
        {step === 'match' && <div className="scanner-match-step">
          <div className="scanner-beta-note"><span>Beta: manual match</span><p>Image recognition is not active. Find the exact print in the real card catalog, then confirm your match.</p></div>
          {previewUrl && <div className="scanner-match-preview"><img src={previewUrl} alt="Local image selected for matching" /><span>LOCAL IMAGE · NOT UPLOADED</span></div>}
          <label className="scanner-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Pokémon, set, or card name…" autoFocus aria-label="Search card catalog for match" data-testid="input-scanner-card-search" /><kbd>CATALOG</kbd></label>
          <div className="scanner-match-results" aria-live="polite">
            {cardsQuery.isLoading ? <div className="scanner-loading" aria-label="Searching card catalog">{[0, 1, 2].map((item) => <div className="scanner-result-skeleton" key={item} />)}</div>
              : cardsQuery.isError ? <div className="scanner-inline-error" role="alert"><AlertTriangle size={15} /> Catalog search failed. <button type="button" onClick={() => cardsQuery.refetch()} data-testid="button-retry-scanner-search">Retry</button></div>
                : (cardsQuery.data ?? []).length ? (cardsQuery.data ?? []).slice(0, 8).map((card) => <button type="button" key={card.id} className={`scanner-match-card ${selectedCard?.id === card.id ? 'selected' : ''}`} aria-pressed={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} data-testid={`button-select-scanner-card-${card.id}`}>
                  <ScannerCardImage card={card} alt="" />
                  <span><strong>{card.name}</strong><small>{card.setName} · {card.rarity} · {card.year}</small></span>
                  <span className="scanner-match-price">{money(card.marketPrice)}<small>SIMULATED</small></span>
                  {selectedCard?.id === card.id && <Check size={16} />}
                </button>)
                  : <div className="scanner-search-empty">{search ? 'No matching print found. Try another search.' : 'Start with a name, set, or card number to find a print.'}</div>}
          </div>
          <div className="scanner-actions scanner-actions-match">
            <button type="button" className="scanner-secondary-button" onClick={() => setStep('viewfinder')} data-testid="button-scanner-back"><ArrowLeft size={15} /> Back</button>
            <button type="button" className="scanner-primary-button" disabled={!selectedCard} onClick={() => selectedCard && setStep('result')} data-testid="button-confirm-scanner-match">Confirm match <ArrowRight size={15} /></button>
          </div>
        </div>}
        {step === 'result' && selectedCard && <div className="scanner-result-step">
          <div className="scanner-confirmation"><ShieldCheck size={16} /><span>MANUAL MATCH CONFIRMED</span></div>
          <CardScannerResult card={selectedCard} />
          <div className="scanner-actions scanner-actions-result">
            <button type="button" className="scanner-secondary-button" onClick={() => setStep('match')} data-testid="button-edit-scanner-match"><ArrowLeft size={15} /> Change match</button>
            <button type="button" className="scanner-primary-button" onClick={closeScanner} data-testid="button-finish-scanner">Done <Check size={15} /></button>
          </div>
        </div>}
      </section>
    </div>, document.body)}
  </>;
}
