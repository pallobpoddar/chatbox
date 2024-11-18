import Redis from 'ioredis';
import { ThirdPartyService } from '../service/thirdParty';
import { RedisManager } from '@one.chat/shared/dist/setup/redis';

export class ThirdPartyWorker {
    private thirdPartyService: ThirdPartyService;

    constructor(thirdPartyService: ThirdPartyService) {
        this.thirdPartyService = thirdPartyService;
    }

    async start(instanceX: Redis) {
        while (true) {
            console.log("Waiting for messages...");
            const result = await (instanceX).blpop("thirdparty:outgoing", 0);
            if (result) {
                const [queue, message] = result;
                await this.thirdPartyService.processMessage(message);
            }
        }
    }
}