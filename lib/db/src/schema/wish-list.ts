import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.cardId] })],
);

export const insertWishListSchema = createInsertSchema(wishListTable).omit({
  userId: true,
  createdAt: true,
});
export type InsertWishList = z.infer<typeof insertWishListSchema>;
export type WishList = typeof wishListTable.$inferSelect;
