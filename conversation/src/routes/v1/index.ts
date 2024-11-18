import express from "express";
import conversationRouter from "./conversation";

const router_v1 = express.Router();

router_v1.use('/conversation',conversationRouter)

export default router_v1