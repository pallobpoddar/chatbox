import express from "express";
import supportRouter from "./support";

const router_v1 = express.Router();

router_v1.use("/support", supportRouter);

export default router_v1;
