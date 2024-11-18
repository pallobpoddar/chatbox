export default interface IMessage {
  action: "sent" | "delivered" | "seen";
  sub: string;
  InboxChunks: {
    conversationId: string;
    chunkSerial: number;
    messages: {
      source: {
        platform: string;
        refId: string;
      };
      sender: string;
      sent: Date;
      delivered: Date;
      seen: Date;
      type: string;
      content: string;
      media: {
        path: string;
        type: string;
        isSaved: true;
        _id: string;
      }[];
      context: string;
      pass: {
        platform: string;
        refId: string;
        _id: string;
      }[];
      isDeleted: boolean;
      _id: string;
    }[];
  }[];
  conversation: {
    participants: [
      {
        id: string;
        isAdmin: boolean;
        info: {
          delivered: number;
          seen: number;
        };
        _id: {
          $oid: string;
        };
      },
      {
        id: string;
        isAdmin: boolean;
        info: {
          delivered: number;
          seen: number;
        };
        _id: {
          $oid: string;
        };
      }
    ];
    group: {
      name: string;
      photo: string;
    };
    totalMessages: number;
    supportParticipants: string[];
    createdAt: {
      $date: Date;
    };
    updatedAt: {
      $date: Date;
    };
    __v: number;
  };
}
