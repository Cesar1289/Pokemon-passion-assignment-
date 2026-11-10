import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  binderEntriesTable,
  cardsTable,
  favoritesTable,
} from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";
import { currentUser } from "../lib/auth";

const router: IRouter = Router();

const dailyFacts = [
  "The Pokémon TCG launched in Japan in October 1996.",
  "Pikachu Illustrator was never sold in stores — around 39 copies were given as contest prizes in CoroCoro magazine.",
  "A graded Pikachu Illustrator sold for over $5 million in 2022, making it the most expensive Pokémon card ever sold.",
  'The "1st Edition" stamp marks cards from a set\'s very first print run.',
  "Gold Star Pokémon appear roughly once per 72 booster packs.",
  'Umbreon VMAX Alt Art\'s fan nickname is "Moonbreon."',
  "Base Set Charizard's Fire Spin attack needs 4 Energy cards — that's why it was hard to play, despite being the most wanted card.",
  "Fake cards often have a brighter or duller back-blue than real ones — comparing backs is the fastest first check.",
  "Charizard has appeared in more special illustrations than any other Pokémon.",
  'Modern "rotation" removes older sets from tournament play every year — old cards stay collectible even when unplayable.',
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const cards = await db.select().from(cardsTable);
  const movers = [...cards]
    .sort((a, b) => Math.abs(b.trendPercent) - Math.abs(a.trendPercent))
    .slice(0, 10);

  const user = await currentUser(req);
  let binderCount = 0;
  let binderValue = 0;
  let favoriteSet = new Set<string>();
  if (user) {
    const entries = await db
      .select({ quantity: binderEntriesTable.quantity, marketPrice: cardsTable.marketPrice })
      .from(binderEntriesTable)
      .innerJoin(cardsTable, eq(binderEntriesTable.cardId, cardsTable.id))
      .where(eq(binderEntriesTable.userId, user.id));
    binderCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    binderValue = Number(entries.reduce((sum, entry) => sum + entry.quantity * entry.marketPrice, 0).toFixed(2));
    const favorites = await db
      .select({ cardId: favoritesTable.cardId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, user.id));
    favoriteSet = new Set(favorites.map((favorite) => favorite.cardId));
  }

  res.json(
    GetDashboardResponse.parse({
      movers: movers.map((card) => ({ ...card, isFavorite: favoriteSet.has(card.id) })),
      dailyFact: dailyFacts[dayOfYear(new Date()) % dailyFacts.length],
      binderCount,
      binderValue,
    }),
  );
});

export default router;
