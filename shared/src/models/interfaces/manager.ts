export interface IManager {
  userId: string;
  managers: {
    id: string;
    role: string;
  }[];
  isDeleted: boolean;
}
