"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupKeycloakAdmin = void 0;
const fs = __importStar(require("fs"));
const openid_client_1 = require("openid-client");
const setupKeycloakAdmin = async (refreshEvery = 29 * 60 * 1000) => {
    const KcAdminClient = await import('@keycloak/keycloak-admin-client');
    const datas = await JSON.parse(fs.readFileSync('./shared/keycloak.json', 'utf-8'));
    const kcAdminClient = new KcAdminClient.default(datas.initOptions);
    await kcAdminClient.auth(datas.loginDetails);
    kcAdminClient.setConfig({
        realmName: datas.workingRealm,
    });
    const keycloakIssuer = await openid_client_1.Issuer.discover(`${datas.initOptions.baseUrl}/realms/${datas.initOptions.realmName}`);
    // console.log(keycloakIssuer);
    const client = new keycloakIssuer.Client({
        client_id: datas.loginDetails.clientId, // Same as `clientId` passed to client.auth()
        token_endpoint_auth_method: 'none', // to send only client_id in the header
    });
    // Use the grant type 'password'
    let tokenSet = await client.grant({
        grant_type: 'password',
        username: datas.loginDetails.username,
        password: datas.loginDetails.password,
    });
    // Periodically using refresh_token grant flow to get new access token here
    setInterval(async () => {
        const refreshToken = tokenSet.refresh_token;
        tokenSet = await client.refresh(refreshToken ?? '');
        kcAdminClient.setAccessToken(tokenSet.access_token ?? '');
        console.log("Admin CLI Token Updated");
    }, refreshEvery); // 58 seconds
    return kcAdminClient;
};
exports.setupKeycloakAdmin = setupKeycloakAdmin;
