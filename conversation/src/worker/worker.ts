import Redis from 'ioredis';
import { IntegrationRepository } from "@one.chat/shared/dist/repositories/IntegrationRepository";
import { MessageRepository } from '@one.chat/shared/dist/repositories/MessageRepository';
import { RedisManager } from '@one.chat/shared/dist/setup/redis';

export class IncomingThirdPartyWorker {
    private integrationRepository: IntegrationRepository;

    constructor(integrationRepository: IntegrationRepository) {
        this.integrationRepository = integrationRepository;
    }

    async start(instanceX: Redis) {
        while (true) {
            console.log("running")
            const result = await (instanceX).blpop("thirdparty:incoming", 0);
            if (result) {
                const [queue, message] = result;
                await this.integrationRepository.processMessage(message);
            }
        }
    }
}