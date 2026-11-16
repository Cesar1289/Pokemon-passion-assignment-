import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AddWishListItemParams,
  AddWishListItemResponse,
  ListWishListResponse,
  RemoveWishListItemParams,
  UpdateWishListTargetBody,
  UpdateWishListTargetParams,
  UpdateWishListTargetResponse,
} from "@workspace/api-zod";
import { db, cardsTable, favoritesTable, priceHistoryTable, wishListTable } from "@workspace/db";
import { requireUser } from "../lib/auth";

const router: IRouter = Router();

async function getWishList(userId: number): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select({ item: wishListTable, card: cardsTable })
    .from(wishListTable)
    .innerJoin(cardsTable, eq(wishListTable.cardId, cardsTable.id))
    .where(eq(wishListTable.userId, userId))
    .orderBy(asc(wishListTable.createdAt));
  if (rows.length === 0) return [];

  const favorites = await db
    .select({ cardId: favoritesTable.cardId })
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        inArray(favoritesTable.cardId, rows.map(({ item }) => item.cardId)),
      ),
    );
  const favoriteIds = new Set(favorites.map((favorite) => favorite.cardId));
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 29);
  const historyRows = await db
    .select({ cardId: priceHistoryTable.cardId, day: priceHistoryTable.day, value: priceHistoryTable.value })
    .from(priceHistoryTable)
    .where(and(
      inArray(priceHistoryTable.cardId, rows.map(({ item }) => item.cardId)),
      gte(priceHistoryTable.day, start.toISOString().slice(0, 10)),
      lte(priceHistoryTable.day, today.toISOString().slice(0, 10)),
    ))
    .orderBy(asc(priceHistoryTable.day));
  const histories = new Map<string, Array<{ day: string; value: number }>>();
  for (const { cardId, day, value } of historyRows) {
    const history = histories.get(cardId) ?? [];
    history.push({ day, value });
    histories.set(cardId, history);
  }
  return rows.map(({ item, card }) => ({
    cardId: item.cardId,
    targetPrice: item.targetPrice,
    history: histories.get(item.cardId) ?? [],
    card: {
      ...card,
      isFavorite: favoriteIds.has(card.id),
      isWishListed: true,
    },
  }));
}

router.get("/wish-list", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(ListWishListResponse.parse(await getWishList(user.id)));
});

router.post("/wish-list/:cardId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = AddWishListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  const [card] = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(eq(cardsTable.id, params.data.cardId))
    .limit(1);
  if (!card) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  await db
    .insert(wishListTable)
    .values({ userId: user.id, cardId: card.id })
    .onConflictDoNothing();
  const entry = (await getWishList(user.id)).find((item) => item.cardId === card.id);
  res.status(201).json(AddWishListItemResponse.parse(entry));
});

router.delete("/wish-list/:cardId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = RemoveWishListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }

  await db
    .delete(wishListTable)
    .where(
      and(
        eq(wishListTable.userId, user.id),
        eq(wishListTable.cardId, params.data.cardId),
      ),
    );
  res.sendStatus(204);
});

router.patch("/wish-list/:cardId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = UpdateWishListTargetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID." });
    return;
  }
  const body = UpdateWishListTargetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Target price must be a nonnegative amount or null." });
    return;
  }

  const [updated] = await db
    .update(wishListTable)
    .set({ targetPrice: body.data.targetPrice })
    .where(and(
      eq(wishListTable.userId, user.id),
      eq(wishListTable.cardId, params.data.cardId),
    ))
    .returning({ cardId: wishListTable.cardId });
  if (!updated) {
    res.status(404).json({ error: "That card is not on your Wish List." });
    return;
  }

  const entry = (await getWishList(user.id)).find((item) => item.cardId === updated.cardId);
  res.json(UpdateWishListTargetResponse.parse(entry));
});

export default router;
