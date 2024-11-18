import express from "express";
import { IntegrationController } from "../../controller/integrationController";
import { IntegrationRepository } from "../../repositories/whatsapp.integration";
import keycloak from "../../setup/keyCloak";
import { JWT_SECRET } from "src/config/config";

async function setupIntegrationRouter() {
  const Keycloak = await import("@one.chat/shared/dist/setup/keycloak.js");
  const kcAdminClient = await Keycloak.setupKeycloakAdmin();
  const integrationRouter = express.Router();
  const integrationRepository = new IntegrationRepository();
  const integrationController = new IntegrationController(
    integrationRepository,
    kcAdminClient
  );

  integrationRouter.use(keycloak.protect());

  integrationRouter.post(
    "/setup/:userId",
    integrationController.createIntegration.bind(integrationController)
  );
  integrationRouter.get(
    "/integration/:phoneNoId",
    integrationController.getIntegrationByPhoneNoId.bind(integrationController)
  );
  integrationRouter.post(
    "/webhooks/:participantId",
    integrationController.incomingMessage.bind(integrationController)
  );

  integrationRouter.get(
    "webhooks/:participantId",
    integrationController.verifyWebhook.bind(integrationController)
  );

  integrationRouter.get(
    "/integrations",
    integrationController.getIntegrations.bind(integrationController)
  );

  integrationRouter.patch(
    "/:userId",
    integrationController.updateWhatsAppCredentials.bind(integrationController)
  );

  integrationRouter.delete(
    "/:userId",
    integrationController.deleteIntegration.bind(integrationController)
  );

  return integrationRouter;
}

export default setupIntegrationRouter;
