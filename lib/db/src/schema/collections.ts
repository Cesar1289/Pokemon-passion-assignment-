import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { cardsTable } from "./cards";
import { usersTable } from "./users";

export const favoritesTable = pgTable(
  "favorites",
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

export const cardNotesTable = pgTable(
  "card_notes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cardsTable.id, { onDelete: "cascade" }),
    note: text("note").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.cardId] })],
);

export const binderEntriesTable = pgTable(
  "binder_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cardsTable.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);
