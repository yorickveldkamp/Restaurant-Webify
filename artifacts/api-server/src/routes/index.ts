import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(reportsRouter);

export default router;
