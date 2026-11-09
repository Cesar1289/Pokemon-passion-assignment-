import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cardsRouter from "./cards";
import binderRouter from "./binder";
import binderSettingsRouter from "./binder-settings";
import dashboardRouter from "./dashboard";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cardsRouter);
router.use(binderSettingsRouter);
router.use(binderRouter);
router.use(dashboardRouter);
router.use(communityRouter);

export default router;
