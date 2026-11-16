import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AddSealedBinderEntryParams,
  AddSealedBinderEntryResponse,
  AddSealedWishListItemParams,
  AddSealedWishListItemResponse,
  ListSealedBinderEntriesResponse,
  ListSealedProductsQueryParams,
  ListSealedProductsResponse,
  ListSealedWishListResponse,
  RemoveSealedBinderEntryParams,
  RemoveSealedWishListItemParams,
  UpdateSealedBinderEntryBody,
  UpdateSealedBinderEntryParams,
  UpdateSealedBinderEntryResponse,
  UpdateSealedWishListTargetBody,
  UpdateSealedWishListTargetParams,
  UpdateSealedWishListTargetResponse,
} from "@workspace/api-zod";
import {
  db,
  sealedBinderEntriesTable,
  sealedPriceHistoryTable,
  sealedProductsTable,
  sealedWishListTable,
} from "@workspace/db";
import { currentUser, requireUser } from "../lib/auth";

const router: IRouter = Router();

type PricePoint = { day: string; value: number };
type ProductMetadata = {
  history: PricePoint[];
  isWishListed: boolean;
  binderQuantity: number;
};
type ProductRow = typeof sealedProductsTable.$inferSelect;

function getHistoryWindow(): { startDay: string; endDay: string } {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    startDay: start.toISOString().slice(0, 10),
    endDay: today.toISOString().slice(0, 10),
  };
}

function getTrendPercent(history: PricePoint[]): number {
  const first = history[0];
  const last = history[history.length - 1];
  if (!first || !last || first.value <= 0) return 0;
  return Number((((last.value - first.value) / first.value) * 100).toFixed(2));
}

async function getProductMetadata(productIds: string[], userId?: number): Promise<Map<string, ProductMetadata>> {
  const metadata = new Map<string, ProductMetadata>();
  if (productIds.length === 0) return metadata;

  const { startDay, endDay } = getHistoryWindow();
  const historyRows = await db
    .select({
      sealedProductId: sealedPriceHistoryTable.sealedProductId,
      day: sealedPriceHistoryTable.day,
      value: sealedPriceHistoryTable.value,
    })
    .from(sealedPriceHistoryTable)
    .where(and(
      inArray(sealedPriceHistoryTable.sealedProductId, productIds),
      gte(sealedPriceHistoryTable.day, startDay),
      lte(sealedPriceHistoryTable.day, endDay),
    ))
    .orderBy(asc(sealedPriceHistoryTable.day));

  const wishRows = userId
    ? await db
        .select({ sealedProductId: sealedWishListTable.sealedProductId })
        .from(sealedWishListTable)
        .where(and(
          eq(sealedWishListTable.userId, userId),
          inArray(sealedWishListTable.sealedProductId, productIds),
        ))
    : [];
  const binderRows = userId
    ? await db
        .select({
          sealedProductId: sealedBinderEntriesTable.sealedProductId,
          quantity: sealedBinderEntriesTable.quantity,
        })
        .from(sealedBinderEntriesTable)
        .where(and(
          eq(sealedBinderEntriesTable.userId, userId),
          inArray(sealedBinderEntriesTable.sealedProductId, productIds),
        ))
    : [];
  const wishListIds = new Set(wishRows.map((row) => row.sealedProductId));
  const quantities = new Map(binderRows.map((row) => [row.sealedProductId, row.quantity]));

  for (const productId of productIds) {
    metadata.set(productId, { history: [], isWishListed: wishListIds.has(productId), binderQuantity: quantities.get(productId) ?? 0 });
  }
  for (const point of historyRows) {
    metadata.get(point.sealedProductId)?.history.push({ day: point.day, value: point.value });
  }
  return metadata;
}

function toProductDto(product: ProductRow, metadata: ProductMetadata) {
  return {
    ...product,
    trendPercent: getTrendPercent(metadata.history),
    isWishListed: metadata.isWishListed,
    binderQuantity: metadata.binderQuantity,
  };
}

async function getSealedWishList(userId: number): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select({ item: sealedWishListTable, product: sealedProductsTable })
    .from(sealedWishListTable)
    .innerJoin(sealedProductsTable, eq(sealedWishListTable.sealedProductId, sealedProductsTable.id))
    .where(eq(sealedWishListTable.userId, userId))
    .orderBy(asc(sealedWishListTable.createdAt));
  const metadata = await getProductMetadata(rows.map(({ item }) => item.sealedProductId), userId);
  return rows.map(({ item, product }) => {
    const details = metadata.get(item.sealedProductId)!;
    return {
      sealedProductId: item.sealedProductId,
      targetPrice: item.targetPrice,
      history: details.history,
      product: toProductDto(product, details),
    };
  });
}

async function getSealedBinderEntries(userId: number): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select({ entry: sealedBinderEntriesTable, product: sealedProductsTable })
    .from(sealedBinderEntriesTable)
    .innerJoin(sealedProductsTable, eq(sealedBinderEntriesTable.sealedProductId, sealedProductsTable.id))
    .where(eq(sealedBinderEntriesTable.userId, userId))
    .orderBy(asc(sealedBinderEntriesTable.createdAt));
  const metadata = await getProductMetadata(rows.map(({ entry }) => entry.sealedProductId), userId);
  return rows.map(({ entry, product }) => {
    const details = metadata.get(entry.sealedProductId)!;
    return {
      id: entry.id,
      sealedProductId: entry.sealedProductId,
      quantity: entry.quantity,
      notes: entry.notes,
      product: {
        ...toProductDto(product, details),
        binderQuantity: entry.quantity,
      },
      totalValue: Number((product.basePrice * entry.quantity).toFixed(2)),
    };
  });
}

router.get("/sealed-products", async (req, res): Promise<void> => {
  const query = ListSealedProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid sealed product filters." });
    return;
  }

  const { search, productType, sort } = query.data;
  const filters = [];
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    filters.push(or(ilike(sealedProductsTable.name, term), ilike(sealedProductsTable.setName, term)));
  }
  if (productType) filters.push(eq(sealedProductsTable.productType, productType));
  const products = await db
    .select()
    .from(sealedProductsTable)
    .where(and(...filters))
    .orderBy(
      ...(sort === "price_asc"
        ? [asc(sealedProductsTable.basePrice), asc(sealedProductsTable.setName)]
        : sort === "price_desc"
          ? [desc(sealedProductsTable.basePrice), asc(sealedProductsTable.setName)]
          : [asc(sealedProductsTable.setName), asc(sealedProductsTable.name)]),
    );
  const user = await currentUser(req);
  const metadata = await getProductMetadata(products.map((product) => product.id), user?.id);
  const payload = products.map((product) => toProductDto(product, metadata.get(product.id)!));
  res.json(ListSealedProductsResponse.parse(payload));
});

router.get("/sealed-wish-list", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(ListSealedWishListResponse.parse(await getSealedWishList(user.id)));
});

router.post("/sealed-wish-list/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = AddSealedWishListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid sealed product ID." });
    return;
  }
  const [product] = await db
    .select({ id: sealedProductsTable.id })
    .from(sealedProductsTable)
    .where(eq(sealedProductsTable.id, params.data.sealedProductId))
    .limit(1);
  if (!product) {
    res.status(404).json({ error: "Sealed product not found." });
    return;
  }
  await db
    .insert(sealedWishListTable)
    .values({ userId: user.id, sealedProductId: product.id })
    .onConflictDoNothing();
  const entry = (await getSealedWishList(user.id)).find((item) => item.sealedProductId === product.id);
  res.status(201).json(AddSealedWishListItemResponse.parse(entry));
});

router.patch("/sealed-wish-list/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = UpdateSealedWishListTargetParams.safeParse(req.params);
  const body = UpdateSealedWishListTargetBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter a valid target price or clear the target." });
    return;
  }
  const [updated] = await db
    .update(sealedWishListTable)
    .set({ targetPrice: body.data.targetPrice })
    .where(and(
      eq(sealedWishListTable.userId, user.id),
      eq(sealedWishListTable.sealedProductId, params.data.sealedProductId),
    ))
    .returning({ sealedProductId: sealedWishListTable.sealedProductId });
  if (!updated) {
    res.status(404).json({ error: "Sealed product is not on your wish list." });
    return;
  }
  const entry = (await getSealedWishList(user.id)).find((item) => item.sealedProductId === updated.sealedProductId);
  res.json(UpdateSealedWishListTargetResponse.parse(entry));
});

router.delete("/sealed-wish-list/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = RemoveSealedWishListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid sealed product ID." });
    return;
  }
  await db
    .delete(sealedWishListTable)
    .where(and(
      eq(sealedWishListTable.userId, user.id),
      eq(sealedWishListTable.sealedProductId, params.data.sealedProductId),
    ));
  res.sendStatus(204);
});

router.get("/sealed-binder", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(ListSealedBinderEntriesResponse.parse(await getSealedBinderEntries(user.id)));
});

router.post("/sealed-binder/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = AddSealedBinderEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid sealed product ID." });
    return;
  }
  const [product] = await db
    .select({ id: sealedProductsTable.id })
    .from(sealedProductsTable)
    .where(eq(sealedProductsTable.id, params.data.sealedProductId))
    .limit(1);
  if (!product) {
    res.status(404).json({ error: "Sealed product not found." });
    return;
  }
  await db
    .insert(sealedBinderEntriesTable)
    .values({ userId: user.id, sealedProductId: product.id, quantity: 1 })
    .onConflictDoUpdate({
      target: [sealedBinderEntriesTable.userId, sealedBinderEntriesTable.sealedProductId],
      set: {
        quantity: sql`${sealedBinderEntriesTable.quantity} + 1`,
        updatedAt: new Date(),
      },
    });
  const entry = (await getSealedBinderEntries(user.id)).find((item) => item.sealedProductId === product.id);
  res.status(201).json(AddSealedBinderEntryResponse.parse(entry));
});

router.patch("/sealed-binder/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = UpdateSealedBinderEntryParams.safeParse(req.params);
  const body = UpdateSealedBinderEntryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter a positive whole-number quantity." });
    return;
  }
  const [updated] = await db
    .update(sealedBinderEntriesTable)
    .set({ quantity: body.data.quantity, updatedAt: new Date() })
    .where(and(
      eq(sealedBinderEntriesTable.userId, user.id),
      eq(sealedBinderEntriesTable.sealedProductId, params.data.sealedProductId),
    ))
    .returning({ sealedProductId: sealedBinderEntriesTable.sealedProductId });
  if (!updated) {
    res.status(404).json({ error: "Sealed product is not in your binder." });
    return;
  }
  const entry = (await getSealedBinderEntries(user.id)).find((item) => item.sealedProductId === updated.sealedProductId);
  res.json(UpdateSealedBinderEntryResponse.parse(entry));
});

router.delete("/sealed-binder/:sealedProductId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = RemoveSealedBinderEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid sealed product ID." });
    return;
  }
  await db
    .delete(sealedBinderEntriesTable)
    .where(and(
      eq(sealedBinderEntriesTable.userId, user.id),
      eq(sealedBinderEntriesTable.sealedProductId, params.data.sealedProductId),
    ));
  res.sendStatus(204);
});

export default router;
