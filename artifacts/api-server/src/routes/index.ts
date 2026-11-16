import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cardsRouter from "./cards";
import binderRouter from "./binder";
import binderSettingsRouter from "./binder-settings";
import dashboardRouter from "./dashboard";
import communityRouter from "./community";
import wishListRouter from "./wish-list";
import sealedProductsRouter from "./sealed-products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cardsRouter);
router.use(binderSettingsRouter);
router.use(binderRouter);
router.use(dashboardRouter);
router.use(communityRouter);
router.use(wishListRouter);
router.use(sealedProductsRouter);

export default router;
