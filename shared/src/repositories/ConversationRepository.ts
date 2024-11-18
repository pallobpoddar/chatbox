import { IConversation } from "../models/interfaces/conversations";
import ConversationModel from "../models/conversations";
import mongoose, { Schema } from "mongoose";
import { group, log } from "console";
import EventAction from "../utils/EventAction";

class ConversationRepository {
  private tokenContent: any = {};
  private redisClient;

  public constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  public setTokenContent(tokenContent: any) {
    this.tokenContent = tokenContent;
  }

  public async findOrCreate(participants: string[]): Promise<IConversation> {
    const existingConversation = await ConversationModel.findOne({
      group: null,
      participants: {
        $all: participants.map((id) => ({
          $elemMatch: {
            id: id,
          },
        })),
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    const participantsObjects = participants.map((participant) => ({
      id: participant,
    }));

    const newConversation = await ConversationModel.create({
      participants: participantsObjects,
      pass: {
        whatsapp: true,
      },
    });

    return newConversation;
  }

  getConversationById(id: string) {
    return ConversationModel.findById(id);
  }

  public async createGroup(
    participants: string[],
    group: { name?: string; photo?: string } | null
  ): Promise<IConversation | null> {
    if (participants.length < 2) {
      throw new Error("A group must have at least two participants.");
    }

    // Add the creator's ID to the participants array if it's not already included
    const creatorId = this.tokenContent?.sub;
    if (!participants.includes(creatorId)) {
      participants.push(creatorId);
    }

    console.log("Participants", participants);

    const participantsObjects = participants.map((participant) => ({
      id: participant,
      isAdmin: participant === creatorId, // Set isAdmin to true if the participant is the group creator
    }));

    // Ensure group is an object and set default values if name or photo is null or undefined
    const groupData = {
      name: group?.name ?? null,
      photo: group?.photo ?? null,
    };

    // Create a new conversation with the provided group data
    const newConversation = new ConversationModel({
      participants: participantsObjects,
      group: groupData,
    });

    await newConversation.save();
    console.log("Created new conversation", newConversation);

    console.log("newConversation", newConversation);
    console.log({
      data: {
        action: "createGroup",
        sub: this.tokenContent?.sub,
        conversation: newConversation,
        InboxChunks: [],
      },
    });

    (await this.redisClient).publish(
      "conversations",
      EventAction("group.create", this.tokenContent?.sub, newConversation, [])
    );

    return newConversation;
  }

  public async getConversationsByParticipant(
    participantId: string,
    offset: number,
    take: number
  ): Promise<IConversation[]> {
    if (participantId !== this.tokenContent.sub) {
      throw { status: 403, message: "Permission denied" };
    }

    const lastConversations = await ConversationModel.aggregate([
      {
        $addFields: {
          lastMessageTime: { $toDate: "$lastMessageTime" },
        },
      },
      {
        $match: {
          $expr: {
            $allElementsTrue: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  $or: [
                    {
                      $lt: ["$$participant.lastDeleteTime", "$lastMessageTime"],
                    },
                    {
                      $not: {
                        $ifNull: ["$$participant.lastDeleteTime", false],
                      },
                    },
                  ],
                },
              },
            },
          },
          participants: {
            $elemMatch: { id: participantId }, // New check to ensure participantId is among participants
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: take,
      },
    ]);

    return lastConversations;
  }

  public async getConversationsByIds(
    conversationIds: mongoose.Types.ObjectId[]
  ): Promise<IConversation[]> {
    const conversations = await ConversationModel.find({
      _id: { $in: conversationIds },
    });

    return conversations;
  }

  public async getDMByParticipants(
    conversationIds: mongoose.Types.ObjectId[]
  ): Promise<IConversation> {
    const conversation = await ConversationModel.findOne({
      participants: {
        $size: 2,
        $all: [
          { $elemMatch: { id: conversationIds[0] } },
          { $elemMatch: { id: conversationIds[1] } },
        ],
      },
      group: null,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  public async addParticipantsToConversation(
    conversationId: mongoose.Types.ObjectId,
    participants: string[]
  ): Promise<IConversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    if (conversation.get("group") === null) {
      throw { status: 400, message: "Conversation is not a group" };
    }

    const isAuthorized = conversation?.participants.some(
      (participant) => participant.id === this.tokenContent.sub
    );
    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    const existingParticipantIds = conversation.participants.map(
      (participant) => participant.id
    );

    const newParticipants = participants.filter(
      (participantId) => !existingParticipantIds.includes(participantId)
    );

    if (newParticipants.length === 0) {
      throw {
        status: 400,
        message: "All participants already exist in the conversation",
      };
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: {
          participants: { $each: newParticipants.map((id) => ({ id })) },
        },
      },
      { new: true }
    );

    (await this.redisClient).publish(
      "conversations",
      EventAction(
        "conversation.updated",
        this.tokenContent?.sub,
        updatedConversation,
        []
      )
    );

    return updatedConversation;
  }

  public async removeParticipantsFromConversation(
    conversationId: mongoose.Types.ObjectId,
    participants: string[]
  ): Promise<IConversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    if (conversation.get("group") === null) {
      throw { status: 400, message: "Conversation is not a group" };
    }

    const isAuthorized = conversation?.participants.some(
      (participant) =>
        participant.id === this.tokenContent.sub && participant.isAdmin === true
    );
    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { participants: { id: { $in: participants } } } },
      { new: true }
    );

    (await this.redisClient).publish(
      "conversations",
      EventAction(
        "conversation.update",
        this.tokenContent?.sub,
        updatedConversation,
        []
      )
    );

    return updatedConversation;
  }

  public async updateGroupInfo(
    conversationId: mongoose.Types.ObjectId,
    group: { name?: string; photo?: string }
  ): Promise<IConversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    if (conversation.get("group") === null) {
      throw { status: 400, message: "Conversation is not a group" };
    }

    const isAuthorized = conversation?.participants.some(
      (participant) => participant.id === this.tokenContent.sub
    );

    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    const updateFields: { [key: string]: any } = {};
    if (group.name !== undefined) updateFields["group.name"] = group.name;
    if (group.photo !== undefined) updateFields["group.photo"] = group.photo;

    const updatedConversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId },
      { $set: updateFields },
      { new: true }
    );

    (await this.redisClient).publish(
      "conversations",
      EventAction(
        "conversation.updated",
        this.tokenContent?.sub,
        updatedConversation,
        []
      )
    );

    return updatedConversation;
  }

  async deleteConversation(
    conversationId: mongoose.Types.ObjectId
  ): Promise<IConversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const isAuthorized = conversation?.participants.some(
      (participant) => participant.id === this.tokenContent.sub
    );

    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    const updatedConversation = await ConversationModel.findOneAndUpdate(
      {
        _id: conversationId,
        participants: {
          $elemMatch: { id: this.tokenContent.sub },
        },
      },
      {
        $set: {
          "participants.$.lastDeleteTime": new Date(),
        },
      },
      { new: true }
    );

    (await this.redisClient).publish(
      "conversations",
      EventAction(
        "conversation.deleted",
        this.tokenContent?.sub,
        updatedConversation,
        []
      )
    );

    return updatedConversation;
  }

  public async getTotalConversationsCount(participantId: string): Promise<number> {
    const totalCount = await ConversationModel.countDocuments({
      participants: { $elemMatch: { id: participantId } }
    });
    return totalCount;
  }
}

export default ConversationRepository;
