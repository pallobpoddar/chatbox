import express from "express";
import setupV1Rout from "./v1/index"

async function setupRoutes() {
    const router = express.Router();
    const v1_route:any = await setupV1Rout()
    router.use('/v1', v1_route)
    return router
}

export default setupRoutes