import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import {
  GetSessionResponse,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from "@workspace/api-zod";
import { currentUser, endSession, hashPassword, startSession, verifyPassword } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/session", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  res.json(GetSessionResponse.parse({ user }));
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success || !/^[A-Za-z0-9_]{3,24}$/.test(parsed.data?.username ?? "")) {
    res.status(400).json({ error: "Use a 3–24 character username with letters, numbers, or underscores, and a password of at least 8 characters." });
    return;
  }

  const username = parsed.data.username.trim().toLowerCase();
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ username, passwordHash: await hashPassword(parsed.data.password) })
      .returning({ id: usersTable.id, username: usersTable.username });
    await startSession(user.id, res);
    res.status(201).json(RegisterResponse.parse({ user }));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "That username is already in use." });
      return;
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid username and password." });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.username.trim().toLowerCase()))
    .limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(400).json({ error: "Username or password is incorrect." });
    return;
  }
  await startSession(user.id, res);
  res.json(LoginResponse.parse({ user: { id: user.id, username: user.username } }));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await endSession(req, res);
  res.sendStatus(204);
});

export default router;
