import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import friendsRouter from "./friends";
import postsRouter from "./posts";
import conversationsRouter from "./conversations";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";
import adminRouter from "./admin";
import statusRouter from "./status";
import { storiesRouter } from "./stories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(friendsRouter);
router.use(postsRouter);
router.use(conversationsRouter);
router.use(notificationsRouter);
router.use(reportsRouter);
router.use(adminRouter);
router.use(statusRouter);
router.use(storiesRouter);

export default router;
