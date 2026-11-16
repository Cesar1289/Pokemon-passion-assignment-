import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { sealedProductsTable } from "./sealed-products";
import { usersTable } from "./users";

export const sealedBinderEntriesTable = pgTable(
  "sealed_binder_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sealedProductId: text("sealed_product_id")
      .notNull()
      .references(() => sealedProductsTable.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sealed_binder_user_product_unique").on(table.userId, table.sealedProductId),
  ],
);

export const sealedWishListTable = pgTable(
  "sealed_wish_list",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sealedProductId: text("sealed_product_id")
      .notNull()
      .references(() => sealedProductsTable.id, { onDelete: "cascade" }),
    targetPrice: real("target_price"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.sealedProductId] })],
);

export const insertSealedBinderEntrySchema = createInsertSchema(sealedBinderEntriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSealedWishListSchema = createInsertSchema(sealedWishListTable).omit({
  userId: true,
  createdAt: true,
});
export type InsertSealedBinderEntry = z.infer<typeof insertSealedBinderEntrySchema>;
export type InsertSealedWishList = z.infer<typeof insertSealedWishListSchema>;
export type SealedBinderEntry = typeof sealedBinderEntriesTable.$inferSelect;
export type SealedWishList = typeof sealedWishListTable.$inferSelect;
