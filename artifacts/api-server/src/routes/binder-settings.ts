import { Router, type IRouter } from "express";
import {
  GetBinderSettingsResponse,
  UpdateBinderSettingsBody,
  UpdateBinderSettingsResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/binder/settings", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const [settings] = await db
    .select({ isPublic: usersTable.isPublic, hideValue: usersTable.hideValue })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (!settings) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  res.json(GetBinderSettingsResponse.parse(settings));
});

router.patch("/binder/settings", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = UpdateBinderSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Choose valid public binder settings." });
    return;
  }

  const [settings] = await db
    .update(usersTable)
    .set(body.data)
    .where(eq(usersTable.id, user.id))
    .returning({ isPublic: usersTable.isPublic, hideValue: usersTable.hideValue });
  if (!settings) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  res.json(UpdateBinderSettingsResponse.parse(settings));
});

export default router;
