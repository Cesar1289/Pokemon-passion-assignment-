import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, text, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const sealedProductsTable = pgTable("sealed_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  setName: text("set_name").notNull(),
  setReleaseYear: integer("set_release_year").notNull(),
  productType: text("product_type").notNull(),
  basePrice: real("base_price").notNull(),
});

export const sealedPriceHistoryTable = pgTable(
  "sealed_price_history",
  {
    id: text("id").primaryKey(),
    sealedProductId: text("sealed_product_id")
      .notNull()
      .references(() => sealedProductsTable.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    value: real("value").notNull(),
  },
  (table) => [
    uniqueIndex("sealed_price_history_product_day_unique").on(table.sealedProductId, table.day),
  ],
);

export const insertSealedProductSchema = createInsertSchema(sealedProductsTable);
export const insertSealedPriceHistorySchema = createInsertSchema(sealedPriceHistoryTable);
export type InsertSealedProduct = z.infer<typeof insertSealedProductSchema>;
export type InsertSealedPriceHistory = z.infer<typeof insertSealedPriceHistorySchema>;
export type SealedProduct = typeof sealedProductsTable.$inferSelect;
export type SealedPriceHistory = typeof sealedPriceHistoryTable.$inferSelect;
