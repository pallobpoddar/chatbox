import express from "express";
import setupUserRouter from "./user";

async function setupV1Rout() {
    const router_v1 = express.Router();
    const user_router:any = await setupUserRouter();
    
    router_v1.use('/user',user_router)
    
    return router_v1
}

export default setupV1Rout