export interface IEventActionPayload {
  action: string;
  sub: string | undefined;
  retryCount?: number;
  conversation: any; // Replace `any` with the appropriate type for your `conversation`
  InboxChunks: any[]; // Replace `any` with the appropriate type for your `InboxChunks`
  manualType?: string | undefined;
}

const EventAction = (
  action: string,
  sub: string | undefined,
  conversation: any,
  InboxChunks: any[],
  retryCount?: number,
  manualType?: string
): string => {
  const payload: IEventActionPayload = {
    action,
    sub,
    conversation,
    InboxChunks,
    retryCount,
    manualType,
  };

  return JSON.stringify(payload);
};

export default EventAction;
