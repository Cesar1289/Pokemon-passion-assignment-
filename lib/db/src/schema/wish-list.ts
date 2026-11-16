import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { cardsTable } from "./cards";
import { usersTable } from "./users";

export const wishListTable = pgTable(
  "wish_list",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cardsTable.id, { onDelete: "cascade" }),
    targetPrice: real("target_price"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.cardId] }),
    check("wish_list_target_price_nonnegative", sql`${table.targetPrice} is null or ${table.targetPrice} >= 0`),
  ],
);

export const insertWishListSchema = createInsertSchema(wishListTable).omit({
  userId: true,
  createdAt: true,
});
export type InsertWishList = z.infer<typeof insertWishListSchema>;
export type WishList = typeof wishListTable.$inferSelect;
