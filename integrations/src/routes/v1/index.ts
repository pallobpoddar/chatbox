import express from "express";
import integrationRouter from "./integration";
import setupIntegrationRouter from "./integration";

async function setupV1Rout() {
    const router_v1 = express.Router();
    const integration_router:any = await setupIntegrationRouter();
    router_v1.use('/integration',integration_router)
    
    return router_v1
}

export default setupV1Rout