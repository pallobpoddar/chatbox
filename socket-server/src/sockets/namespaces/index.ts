import { initNamespace } from "./init";

export function initSocketNamespaces(io: any, keycloak: any) {
  // create namespace
  const chat_namespace = initNamespace(io, "/chat", keycloak);
  const support_namespace = initNamespace(io, "/support", keycloak);

  return { chat_namespace, support_namespace };
}
