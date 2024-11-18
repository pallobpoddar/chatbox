import Keycloak from 'keycloak-connect';
import session from 'express-session';
import path from 'path';

const memoryStore = new session.MemoryStore();

const keycloakConfigPath = path.resolve(__dirname, '../../','keycloak.json');
const keycloak = new Keycloak({store: memoryStore}, keycloakConfigPath);

export default keycloak