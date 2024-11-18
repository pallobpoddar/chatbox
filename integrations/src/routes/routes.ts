import express from "express";
import router_v1 from "./v1/index";

async function setupRoutes() {
    const router = express.Router();
    const v1_route:any = await router_v1()
    router.use('/v1', v1_route)
    return router
}

export default setupRoutes