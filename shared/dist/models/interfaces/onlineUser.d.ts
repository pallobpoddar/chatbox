export interface IOnlineUser {
    userId: string;
    source: "chat" | "support";
    onlineTime?: Date | null;
    lastOnlineTime?: Date | null;
}
