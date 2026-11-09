import { date, integer, pgTable, real, text, uniqueIndex } from "drizzle-orm/pg-core";

export const cardsTable = pgTable("cards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  setName: text("set_name").notNull(),
  setId: text("set_id").notNull(),
  number: text("number").notNull(),
  rarity: text("rarity").notNull(),
  type: text("type").notNull(),
  year: integer("year").notNull(),
  artist: text("artist").notNull(),
  imageUrl: text("image_url").notNull(),
  marketPrice: real("market_price").notNull(),
  trendPercent: real("trend_percent").notNull().default(0),
  authenticationTip: text("authentication_tip").notNull(),
  tags: text("tags").array().notNull().default([]),
});

export const priceHistoryTable = pgTable(
  "price_history",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cardsTable.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    value: real("value").notNull(),
  },
  (table) => [uniqueIndex("price_history_card_day_unique").on(table.cardId, table.day)],
);

export type Card = typeof cardsTable.$inferSelect;
