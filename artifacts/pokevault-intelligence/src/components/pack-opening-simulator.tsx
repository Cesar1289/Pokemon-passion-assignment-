import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Gift, PackageOpen, Sparkles, X } from 'lucide-react';
import { Link } from 'wouter';
import type { Card, SealedProduct } from '@workspace/api-client-react';
import { createPackCardPools, drawPackCards, expectedPackValue, PACK_RARITY_ODDS, cardRarityTier } from '@/lib/pack-opening';
import './pack-opening-simulator.css';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function PackArtwork({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return failed || !src
    ? <div className={`${className} pack-art-fallback`} aria-hidden="true"><PackageOpen size={29} /></div>
    : <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function CardArtwork({ card, className }: { card: Card; className: string }) {
  const [failed, setFailed] = useState(false);
  const hasArtwork = !failed && card.imageUrl !== '/artwork-unavailable.svg';
  return <img
    className={className}
    src={hasArtwork ? card.imageUrl : '/artwork-unavailable.svg'}
    alt={hasArtwork ? `${card.name} card artwork` : `${card.name} card artwork unavailable`}
    onError={() => setFailed(true)}
  />;
}

function rarityClass(card: Card) {
  return `pack-rarity-${cardRarityTier(card.rarity) ?? 'rare'}`;
}

export function PackOpeningSimulator({ product, cards, user, onClose, onAddToBinder, onAddToWishList }: {
  product: SealedProduct;
  cards: Card[];
  user: { username: string } | null;
  onClose: () => void;
  onAddToBinder: (card: Card, product: SealedProduct) => Promise<void>;
  onAddToWishList: (card: Card) => Promise<void>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const flipTimerRef = useRef<number | null>(null);
  const [screen, setScreen] = useState<'reveal' | 'summary'>('reveal');
  const [revealedCount, setRevealedCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [savedBinderPulls, setSavedBinderPulls] = useState<Set<number>>(() => new Set());
  const [pendingBinderPulls, setPendingBinderPulls] = useState<Set<number>>(() => new Set());
  const [savedWishListCards, setSavedWishListCards] = useState<Set<string>>(
    () => new Set(cards.filter((card) => card.isWishListed).map((card) => card.id)),
  );
  const [pendingWishListCards, setPendingWishListCards] = useState<Set<string>>(() => new Set());
  const poolResult = useMemo(() => createPackCardPools(cards, product.setName), [cards, product.setName]);
  const pulls = useMemo(
    () => poolResult.pools ? drawPackCards(poolResult.pools) : [],
    // A new simulator instance is mounted for each pack opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const expectedValue = poolResult.pools ? expectedPackValue(poolResult.pools) : 0;
  const currentCard = pulls[revealedCount];
  const totalPullValue = pulls.reduce((total, card) => total + card.marketPrice, 0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const revealNext = () => {
    if (!isFlipped) {
      setIsFlipping(true);
      setIsFlipped(true);
      flipTimerRef.current = window.setTimeout(() => setIsFlipping(false), 720);
      return;
    }
    if (revealedCount >= pulls.length - 1) {
      setScreen('summary');
      return;
    }
    setRevealedCount((count) => count + 1);
    setIsFlipped(false);
    setIsFlipping(false);
  };

  const addPullToBinder = async (card: Card, index: number) => {
    if (pendingBinderPulls.has(index) || savedBinderPulls.has(index)) return;
    setPendingBinderPulls((current) => new Set(current).add(index));
    try {
      await onAddToBinder(card, product);
      setSavedBinderPulls((current) => new Set(current).add(index));
    } catch {
      // The parent shows the API error; leave this pull available to retry.
    } finally {
      setPendingBinderPulls((current) => {
        const next = new Set(current);
        next.delete(index);
        return next;
      });
    }
  };

  const addPullToWishList = async (card: Card) => {
    if (pendingWishListCards.has(card.id) || savedWishListCards.has(card.id)) return;
    setPendingWishListCards((current) => new Set(current).add(card.id));
    try {
      await onAddToWishList(card);
      setSavedWishListCards((current) => new Set(current).add(card.id));
    } catch {
      // The parent shows the API error; leave this card available to retry.
    } finally {
      setPendingWishListCards((current) => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
    }
  };

  if (!poolResult.pools) {
    return createPortal(<div className="pack-sim-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="pack-sim-dialog" role="dialog" aria-modal="true" aria-labelledby="pack-sim-title" data-testid="dialog-pack-simulator">
        <header className="pack-sim-header">
          <div><span className="pack-sim-kicker">POKEVAULT / PACK SIMULATOR</span><h2 id="pack-sim-title">Pack opening</h2></div>
          <button ref={closeButtonRef} className="pack-sim-close" type="button" aria-label="Close pack simulator" onClick={onClose} data-testid="button-close-pack-simulator"><X size={18} /></button>
        </header>
        <div className="pack-sim-error" role="alert"><PackageOpen size={22} /><div><strong>Pulls are unavailable</strong><p>The catalog needs cards across all four rarity groups before this pack can be simulated.</p></div></div>
      </section>
    </div>, document.body);
  }

  return createPortal(<div className="pack-sim-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`pack-sim-dialog ${screen === 'summary' ? 'pack-sim-dialog-summary' : ''}`} role="dialog" aria-modal="true" aria-labelledby="pack-sim-title" data-testid="dialog-pack-simulator">
      <header className="pack-sim-header">
        <div><span className="pack-sim-kicker">POKEVAULT / PACK SIMULATOR</span><h2 id="pack-sim-title">{screen === 'summary' ? 'Your pack pull' : 'Open a pack'}</h2></div>
        <button ref={closeButtonRef} className="pack-sim-close" type="button" aria-label="Close pack simulator" onClick={onClose} data-testid="button-close-pack-simulator"><X size={18} /></button>
      </header>

      {screen === 'reveal' && currentCard && <div className="pack-reveal-screen">
        <div className="pack-reveal-product">
          <PackArtwork className="pack-reveal-product-image" src={product.imageUrl} alt={`${product.name} pack`} />
          <div><span>{product.setName}</span><strong>{product.name}</strong><small>{money(product.basePrice)} simulated pack price</small></div>
          <span className="pack-reveal-counter" data-testid="text-pack-progress">{String(revealedCount + 1).padStart(2, '0')} <i>/</i> 10</span>
        </div>
        <div className="pack-progress-track" aria-label={`${revealedCount} of 10 cards revealed`}><span style={{ width: `${(revealedCount / 10) * 100}%` }} /></div>
        <div className="pack-odds" aria-label="Simulated rarity odds per card">
          {PACK_RARITY_ODDS.map(({ tier, label, probability }) => <span key={tier} className={`pack-odds-chip pack-rarity-${tier}`}><i />{label} <b>{probability * 100}%</b></span>)}
        </div>

        <div className="pack-card-stage" aria-live="polite">
          <div className={`pack-card-flip ${isFlipped ? 'pack-card-flipped' : ''} ${isFlipping ? 'pack-card-flipping' : ''}`}>
            <div className="pack-card-face pack-card-back" aria-hidden={isFlipped}>
              <div className="pack-card-back-mark"><span>POKEVAULT</span><PackageOpen size={30} /><small>SIMULATED PULL</small></div>
            </div>
            <div className="pack-card-face pack-card-front" aria-hidden={!isFlipped}>
              <CardArtwork card={currentCard} className="pack-pull-art" />
              <div className="pack-card-front-copy">
                <div><span className={`pack-rarity-pill ${rarityClass(currentCard)}`}>{currentCard.rarity}</span><span className="pack-pull-set">{currentCard.setName} · {currentCard.number}</span></div>
                <strong>{currentCard.name}</strong>
                <span className="pack-pull-price">{money(currentCard.marketPrice)} <i>SIMULATED</i></span>
              </div>
            </div>
          </div>
        </div>
        <div className="pack-reveal-footer">
          <p>{isFlipped ? `Card ${revealedCount + 1} of 10 revealed` : 'Ready for the next card?'}</p>
          <button className="pack-sim-primary" type="button" onClick={revealNext} disabled={isFlipping} data-testid={isFlipped ? 'button-next-pack-card' : 'button-reveal-pack-card'}>
            {isFlipping ? 'Revealing…' : isFlipped ? revealedCount === pulls.length - 1 ? <><Gift size={16} /> See pull summary</> : <>Next card <ArrowRight size={15} /></> : <><Sparkles size={16} /> Reveal card</>}
          </button>
        </div>
      </div>}

      {screen === 'summary' && <div className="pack-summary-screen">
        <div className="pack-summary-hero">
          <div className="pack-summary-emblem"><Gift size={22} /></div>
          <div><span>PACK OPENED · 10 SIMULATED CARDS</span><h3>{product.name}</h3><small>{product.setName}</small></div>
        </div>
        <div className="pack-summary-totals">
          <div><span>TOTAL PULL VALUE · SIMULATED</span><strong data-testid="text-pack-pull-total">{money(totalPullValue)}</strong></div>
          <div><span>PACK PRICE · SIMULATED</span><strong data-testid="text-pack-simulated-price">{money(product.basePrice)}</strong></div>
        </div>
        <div className="pack-expected-value" data-testid="text-pack-expected-value">
          <div><Sparkles size={17} /><span>EXPECTED VALUE PER PACK</span></div>
          <strong>{money(expectedValue)} <small>simulated</small></strong>
          <p>Long-run average of 10 pulls using the listed rarity odds and current simulated card prices. A single pack can vary.</p>
        </div>
        {poolResult.usesRareHoloFallback && <p className="pack-catalog-note">The seeded catalog has no non-holo Rare cards; Rare slots use Rare Holo cards as the closest available match.</p>}
        {poolResult.catalogFallbackTiers.length > 0 && <p className="pack-catalog-note">This set has no seeded {poolResult.catalogFallbackTiers.map((tier) => PACK_RARITY_ODDS.find((odds) => odds.tier === tier)?.label.toLowerCase()).join(', ')} cards, so those rarity slots draw from the existing catalog.</p>}
        <div className="pack-pull-list" aria-label="Cards pulled from this pack">
          {pulls.map((card, index) => <article className="pack-pull-row" key={`${card.id}-${index}`} data-testid={`pack-pull-${index}`}>
            <span className="pack-pull-number">{String(index + 1).padStart(2, '0')}</span>
            <CardArtwork card={card} className="pack-pull-thumb" />
            <div className="pack-pull-row-copy"><strong>{card.name}</strong><span>{card.setName} · <i className={`pack-rarity-pill ${rarityClass(card)}`}>{card.rarity}</i></span></div>
            <strong className="pack-pull-row-price">{money(card.marketPrice)}<small>SIMULATED</small></strong>
            {user && <div className="pack-pull-actions">
              <button type="button" className={`pack-pull-action ${savedBinderPulls.has(index) ? 'pack-pull-action-saved' : ''}`} onClick={() => void addPullToBinder(card, index)} disabled={savedBinderPulls.has(index) || pendingBinderPulls.has(index)} aria-label={`Add ${card.name} pull to binder`} data-testid={`button-pack-add-binder-${index}`}>
                {savedBinderPulls.has(index) ? <><Check size={13} /> Added</> : pendingBinderPulls.has(index) ? 'Saving…' : 'Add to binder'}
              </button>
              <button type="button" className={`pack-pull-action ${savedWishListCards.has(card.id) ? 'pack-pull-action-saved' : ''}`} onClick={() => void addPullToWishList(card)} disabled={savedWishListCards.has(card.id) || pendingWishListCards.has(card.id)} aria-label={`Add ${card.name} to Wish List`} data-testid={`button-pack-add-wishlist-${index}`}>
                {savedWishListCards.has(card.id) ? <><Check size={13} /> On Wish List</> : pendingWishListCards.has(card.id) ? 'Saving…' : 'Wish List'}
              </button>
            </div>}
          </article>)}
        </div>
        {user ? <p className="pack-save-note">Pack pulls are simulated. Binder entries are marked as simulated pack pulls.</p> : <p className="pack-signin-note"><Link href="/login">Sign in</Link> to add pulls to your binder or Wish List.</p>}
        <div className="pack-summary-footer">
          <button className="pack-sim-secondary" type="button" onClick={onClose} data-testid="button-finish-pack-opening"><ArrowLeft size={15} /> Back to sealed products</button>
          <span><Check size={14} /> All values are simulated</span>
        </div>
      </div>}
    </section>
  </div>, document.body);
}
