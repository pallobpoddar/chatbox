export interface IEventActionPayload {
    action: string;
    sub: string | undefined;
    retryCount?: number;
    conversation: any;
    InboxChunks: any[];
    manualType?: string | undefined;
}
declare const EventAction: (action: string, sub: string | undefined, conversation: any, InboxChunks: any[], retryCount?: number, manualType?: string) => string;
export default EventAction;
