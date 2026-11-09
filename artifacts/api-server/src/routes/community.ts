import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetCommunityBinderParams,
  GetCommunityBinderResponse,
  ListPublicBindersResponse,
} from "@workspace/api-zod";
import {
  binderEntriesTable,
  cardsTable,
  db,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/community", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      userId: usersTable.id,
      username: usersTable.username,
      hideValue: usersTable.hideValue,
      entryId: binderEntriesTable.id,
      quantity: binderEntriesTable.quantity,
    })
    .from(usersTable)
    .leftJoin(binderEntriesTable, eq(binderEntriesTable.userId, usersTable.id))
    .where(eq(usersTable.isPublic, true))
    .orderBy(asc(usersTable.username));

  const binders = new Map<number, {
    userId: number;
    username: string;
    hideValue: boolean;
    cardCount: number;
    uniqueCardCount: number;
  }>();
  for (const row of rows) {
    const binder = binders.get(row.userId) ?? {
      userId: row.userId,
      username: row.username,
      hideValue: row.hideValue,
      cardCount: 0,
      uniqueCardCount: 0,
    };
    if (row.entryId !== null) {
      binder.cardCount += row.quantity ?? 0;
      binder.uniqueCardCount += 1;
    }
    binders.set(row.userId, binder);
  }

  res.json(ListPublicBindersResponse.parse([...binders.values()]));
});

router.get("/community/:userId", async (req, res): Promise<void> => {
  const params = GetCommunityBinderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid public binder." });
    return;
  }

  const [owner] = await db
    .select({
      userId: usersTable.id,
      username: usersTable.username,
      hideValue: usersTable.hideValue,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, params.data.userId), eq(usersTable.isPublic, true)))
    .limit(1);
  if (!owner) {
    res.status(404).json({ error: "Public binder not found." });
    return;
  }

  const rows = await db
    .select({ entry: binderEntriesTable, card: cardsTable })
    .from(binderEntriesTable)
    .innerJoin(cardsTable, eq(binderEntriesTable.cardId, cardsTable.id))
    .where(eq(binderEntriesTable.userId, owner.userId))
    .orderBy(asc(cardsTable.name));

  const profile = {
    userId: owner.userId,
    username: owner.username,
    cardCount: rows.reduce((sum, row) => sum + row.entry.quantity, 0),
    uniqueCardCount: rows.length,
    hideValue: owner.hideValue,
  };
  const portfolioValue = Number(
    rows.reduce((sum, row) => sum + row.card.marketPrice * row.entry.quantity, 0).toFixed(2),
  );
  res.json(GetCommunityBinderResponse.parse({
    profile,
    entries: rows.map(({ entry, card }) => ({
      cardId: entry.cardId,
      condition: entry.condition,
      quantity: entry.quantity,
      card: { ...card, isFavorite: false },
    })),
    portfolioValue: owner.hideValue ? null : portfolioValue,
  }));
});

export default router;
