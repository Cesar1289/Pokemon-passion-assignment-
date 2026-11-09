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
  "The Pokémon TCG launched in Japan in 1996, before arriving in North America in 1999.",
  "The 1998 Pikachu Illustrator was awarded through illustration contests and is one of the best-known promo cards.",
  "Gold Star Pokémon cards debuted in the EX era and are prized for their alternate-color artwork.",
  "A card's condition is assessed across centering, corners, edges, and surface—not just the front.",
  "Pokémon card set symbols and numbering help collectors identify a card's release and rarity.",
  "Modern Special Illustration Rare cards often use etched texture that continues through the artwork.",
  "The first English Pokémon TCG expansion was Base Set, released in 1999.",
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
