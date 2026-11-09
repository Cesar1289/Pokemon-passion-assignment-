import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateBinderEntryBody,
  CreateBinderEntryResponse,
  DeleteBinderEntryParams,
  DeleteBinderEntryResponse,
  ListBinderEntriesResponse,
  UpdateBinderEntryBody,
  UpdateBinderEntryParams,
  UpdateBinderEntryResponse,
} from "@workspace/api-zod";
import {
  db,
  binderEntriesTable,
  cardsTable,
  favoritesTable,
} from "@workspace/db";
import { requireUser } from "../lib/auth";

const router: IRouter = Router();

async function getEntries(userId: number): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select({ entry: binderEntriesTable, card: cardsTable })
    .from(binderEntriesTable)
    .innerJoin(cardsTable, eq(binderEntriesTable.cardId, cardsTable.id))
    .where(eq(binderEntriesTable.userId, userId))
    .orderBy(asc(binderEntriesTable.createdAt));
  const favorites = await db
    .select({ cardId: favoritesTable.cardId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favoriteSet = new Set(favorites.map((favorite) => favorite.cardId));
  return rows.map(({ entry, card }) => ({
    id: entry.id,
    cardId: entry.cardId,
    condition: entry.condition,
    quantity: entry.quantity,
    notes: entry.notes,
    card: { ...card, isFavorite: favoriteSet.has(card.id) },
    totalValue: Number((card.marketPrice * entry.quantity).toFixed(2)),
  }));
}

router.get("/binder", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(ListBinderEntriesResponse.parse(await getEntries(user.id)));
});

router.post("/binder", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = CreateBinderEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Choose a card, condition, and a positive quantity." });
    return;
  }
  const [card] = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(eq(cardsTable.id, body.data.cardId))
    .limit(1);
  if (!card) {
    res.status(400).json({ error: "That card is not in the catalog." });
    return;
  }
  const [entry] = await db
    .insert(binderEntriesTable)
    .values({
      userId: user.id,
      cardId: body.data.cardId,
      condition: body.data.condition,
      quantity: body.data.quantity,
      notes: body.data.notes,
    })
    .returning({ id: binderEntriesTable.id });
  const rows = await getEntries(user.id);
  const result = rows.find((row) => row.id === entry.id);
  res.status(201).json(CreateBinderEntryResponse.parse(result));
});

router.patch("/binder/:entryId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = UpdateBinderEntryParams.safeParse(req.params);
  const body = UpdateBinderEntryBody.safeParse(req.body);
  if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0) {
    res.status(400).json({ error: "Enter a valid condition, positive quantity, or note." });
    return;
  }
  const [entry] = await db
    .update(binderEntriesTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(binderEntriesTable.id, params.data.entryId), eq(binderEntriesTable.userId, user.id)))
    .returning({ id: binderEntriesTable.id });
  if (!entry) {
    res.status(404).json({ error: "Binder entry not found." });
    return;
  }
  const result = (await getEntries(user.id)).find((row) => row.id === entry.id);
  res.json(UpdateBinderEntryResponse.parse(result));
});

router.delete("/binder/:entryId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = DeleteBinderEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid binder entry." });
    return;
  }
  const [deleted] = await db
    .delete(binderEntriesTable)
    .where(and(eq(binderEntriesTable.id, params.data.entryId), eq(binderEntriesTable.userId, user.id)))
    .returning({ id: binderEntriesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Binder entry not found." });
    return;
  }
  res.sendStatus(204);
});

export default router;
