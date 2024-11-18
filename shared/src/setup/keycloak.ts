import * as fs from 'fs';
import { Issuer } from 'openid-client';

export const setupKeycloakAdmin = async (refreshEvery:number=29 * 60 * 1000): Promise<any> => {
    const KcAdminClient = await import('@keycloak/keycloak-admin-client');
    const datas = await JSON.parse(fs.readFileSync('./shared/keycloak-admin.json', 'utf-8'));
    const kcAdminClient = new KcAdminClient.default(datas.initOptions);
    await kcAdminClient.auth(datas.loginDetails);
    kcAdminClient.setConfig({
        realmName: datas.workingRealm,
    });

    const keycloakIssuer = await Issuer.discover(
        `${datas.initOptions.baseUrl}/realms/${datas.initOptions.realmName}`,
    );

    // console.log(keycloakIssuer);
    
    const client = new keycloakIssuer.Client({
        client_id: datas.loginDetails.clientId, // Same as `clientId` passed to client.auth()
        token_endpoint_auth_method: 'none', // to send only client_id in the header
    });

    const loginToAdmin = async () => {
        // Use the grant type 'password'
        return await client.grant({
            grant_type: 'password',
            username: datas.loginDetails.username,
            password: datas.loginDetails.password,
        });
    }

    // Use the grant type 'password'
    let tokenSet = await loginToAdmin();

    // Periodically using refresh_token grant flow to get new access token here
    setInterval(async () => {
        try {
            const refreshToken = tokenSet.refresh_token;
            tokenSet = await client.refresh(refreshToken ?? '');
            kcAdminClient.setAccessToken(tokenSet.access_token ?? '');
            console.log("Admin CLI Token Updated");
        } catch (error) {
            console.log(error);
            console.log("Trying To Login Again...");
            tokenSet = await loginToAdmin();
        }
        
    }, refreshEvery); // 29 mins

    return kcAdminClient
}


