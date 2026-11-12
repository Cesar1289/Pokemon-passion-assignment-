import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, cardsTable, cardNotesTable, favoritesTable, priceHistoryTable, wishListTable } from "@workspace/db";
import {
  AddFavoriteParams,
  GetCardNoteParams,
  GetCardNoteResponse,
  GetCardParams,
  GetCardResponse,
  ListCardsQueryParams,
  ListCardsResponse,
  RemoveFavoriteParams,
  SaveCardNoteBody,
  SaveCardNoteParams,
  SaveCardNoteResponse,
} from "@workspace/api-zod";
import { currentUser, requireUser } from "../lib/auth";

const router: IRouter = Router();

function cardDto(
  card: typeof cardsTable.$inferSelect,
  isFavorite = false,
  isWishListed = false,
): Record<string, unknown> {
  return {
    ...card,
    isFavorite,
    isWishListed,
  };
}

async function favoriteIds(userId: number, cardIds: string[]): Promise<Set<string>> {
  if (cardIds.length === 0) return new Set();
  const rows = await db
    .select({ cardId: favoritesTable.cardId })
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), inArray(favoritesTable.cardId, cardIds)));
  return new Set(rows.map((row) => row.cardId));
}

async function wishListIds(userId: number, cardIds: string[]): Promise<Set<string>> {
  if (cardIds.length === 0) return new Set();
  const rows = await db
    .select({ cardId: wishListTable.cardId })
    .from(wishListTable)
    .where(and(eq(wishListTable.userId, userId), inArray(wishListTable.cardId, cardIds)));
  return new Set(rows.map((row) => row.cardId));
}

router.get("/cards", async (req, res): Promise<void> => {
  const queryInput: Record<string, unknown> = { ...req.query };
  for (const key of ["sets", "rarities", "types"]) {
    if (typeof queryInput[key] === "string") queryInput[key] = [queryInput[key]];
  }
  const parsed = ListCardsQueryParams.safeParse(queryInput);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid catalog filters." });
    return;
  }
  const { search, sets, rarities, types, sort, favoritesOnly } = parsed.data;
  const filters = [];
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    filters.push(
      or(
        ilike(cardsTable.name, term),
        ilike(cardsTable.setName, term),
        ilike(cardsTable.number, term),
        ilike(cardsTable.artist, term),
      ),
    );
  }
  if (sets?.length) filters.push(inArray(cardsTable.setName, sets));
  if (rarities?.length) filters.push(inArray(cardsTable.rarity, rarities));
  if (types?.length) filters.push(inArray(cardsTable.type, types));

  const cards = await db
    .select()
    .from(cardsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(
      sort === "price_asc"
        ? asc(cardsTable.marketPrice)
        : sort === "price_desc"
          ? desc(cardsTable.marketPrice)
          : asc(cardsTable.name),
    );

  const user = await currentUser(req);
  if (favoritesOnly && !user) {
    res.json(ListCardsResponse.parse([]));
    return;
  }
  const [favorites, wishList] = user
    ? await Promise.all([
        favoriteIds(user.id, cards.map((card) => card.id)),
        wishListIds(user.id, cards.map((card) => card.id)),
      ])
    : [new Set<string>(), new Set<string>()];
  const result = cards
    .filter((card) => !favoritesOnly || favorites.has(card.id))
    .map((card) => cardDto(card, favorites.has(card.id), wishList.has(card.id)));
  res.json(ListCardsResponse.parse(result));
});

router.get("/cards/:cardId", async (req, res): Promise<void> => {
  const params = GetCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, params.data.cardId)).limit(1);
  if (!card) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  const history = await db
    .select({ day: priceHistoryTable.day, value: priceHistoryTable.value })
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.cardId, card.id))
    .orderBy(asc(priceHistoryTable.day));
  const allCards = await db.select().from(cardsTable).where(eq(cardsTable.setId, card.setId));
  let related = allCards.filter((candidate) => candidate.id !== card.id);
  if (related.length < 6) {
    const all = await db.select().from(cardsTable);
    const existing = new Set([card.id, ...related.map((item) => item.id)]);
    const matching = all.filter(
      (candidate) =>
        !existing.has(candidate.id) &&
        candidate.tags.some((tag) => card.tags.includes(tag)),
    );
    related = [...related, ...matching].slice(0, 6);
  } else {
    related = related.slice(0, 6);
  }

  const user = await currentUser(req);
  const cardIds = [card.id, ...related.map((item) => item.id)];
  const [favorites, wishList] = user
    ? await Promise.all([favoriteIds(user.id, cardIds), wishListIds(user.id, cardIds)])
    : [new Set<string>(), new Set<string>()];
  const result = {
    ...cardDto(card, favorites.has(card.id), wishList.has(card.id)),
    history,
    relatedCards: related.map((item) => cardDto(item, favorites.has(item.id), wishList.has(item.id))),
  };
  res.json(GetCardResponse.parse(result));
});

router.post("/cards/:cardId/favorite", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  const [card] = await db.select({ id: cardsTable.id }).from(cardsTable).where(eq(cardsTable.id, params.data.cardId)).limit(1);
  if (!card) {
    res.status(404).json({ error: "Card not found." });
    return;
  }
  await db
    .insert(favoritesTable)
    .values({ userId: user.id, cardId: card.id })
    .onConflictDoNothing();
  res.sendStatus(204);
});

router.delete("/cards/:cardId/favorite", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, user.id), eq(favoritesTable.cardId, params.data.cardId)));
  res.sendStatus(204);
});

router.get("/cards/:cardId/note", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = GetCardNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  const [row] = await db
    .select({ note: cardNotesTable.note })
    .from(cardNotesTable)
    .where(and(eq(cardNotesTable.userId, user.id), eq(cardNotesTable.cardId, params.data.cardId)))
    .limit(1);
  res.json(GetCardNoteResponse.parse({ cardId: params.data.cardId, note: row?.note ?? null }));
});

router.put("/cards/:cardId/note", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = SaveCardNoteParams.safeParse(req.params);
  const body = SaveCardNoteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter a note under 2,000 characters." });
    return;
  }
  const [card] = await db.select({ id: cardsTable.id }).from(cardsTable).where(eq(cardsTable.id, params.data.cardId)).limit(1);
  if (!card) {
    res.status(404).json({ error: "Card not found." });
    return;
  }
  const [saved] = await db
    .insert(cardNotesTable)
    .values({ userId: user.id, cardId: card.id, note: body.data.note })
    .onConflictDoUpdate({
      target: [cardNotesTable.userId, cardNotesTable.cardId],
      set: { note: body.data.note, updatedAt: new Date() },
    })
    .returning({ note: cardNotesTable.note });
  res.json(SaveCardNoteResponse.parse({ cardId: card.id, note: saved.note }));
});

export default router;
