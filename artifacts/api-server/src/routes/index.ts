import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import draftsRouter from "./drafts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(draftsRouter);

export default router;
