interface IEventActionPayload {
    action: string;
    sub: string|undefined;
    participants: any[];
    conversation: any; // Replace `any` with the appropriate type for your `conversation`
    InboxChunks: any[]; // Replace `any` with the appropriate type for your `InboxChunks`
    whatsAppService?: {}
  }
  
  const EventAction = (action: string, sub: string|undefined, participants: any[], conversation: any, InboxChunks: any[],whatsAppService?: {}): string => {
    const payload: IEventActionPayload = {
      action,
      sub,
      participants,
      conversation,
      InboxChunks,
      whatsAppService
    };
  
    return JSON.stringify(payload);
  };

  export default EventAction