import { Conversation, MessageInConversation } from "../../types";
import {
  callAPIGetSummary,
  callAPIWriteMessagePairToConversation,
} from "../../utils/apis";

export class ConversationController {
  private conversation: Conversation;

  constructor() {
    this.conversation = {
      _id: "",
      userId: "",
      tile: "",
      summary: "",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  setConversation(conversation: Conversation) {
    this.conversation = conversation;
  }
  initializeNewConversation() {
    this.conversation = {
      _id: "",
      userId: "",
      tile: "",
      summary: "",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async addMessagePairToHistory(
    userMessage: MessageInConversation,
    aiMessage: MessageInConversation
  ) {
    const res1 = await callAPIWriteMessagePairToConversation(
      userMessage,
      this.conversation.userId,
      this.conversation._id
    );
    console.log("res1", res1.newOrUpdateConversation);
    this.conversation._id = res1.newOrUpdateConversation?._id;
    const newSummary = await callAPIGetSummary(
      this.conversation.summary,
      userMessage,
      aiMessage
    );

    this.setSummary(newSummary);

    const res2 = await callAPIWriteMessagePairToConversation(
      aiMessage,
      this.conversation.userId,
      this.conversation._id,
      this.conversation.summary
    );
    console.log("res2", res2.newOrUpdateConversation);

    console.log("newOrUpdateConversation", res2.newOrUpdateConversation);
    if (res2.newOrUpdateConversation) {
      this.setConversation(res2.newOrUpdateConversation);
    }
  }

  setSummary(summary: string) {
    this.conversation.summary = summary;
  }

  getSummary() {
    return this.conversation.summary;
  }

  getMessages() {
    return this.conversation.messages;
  }
  getconversation() {
    return this.conversation;
  }
  setUserId(userId: string) {
    this.conversation.userId = userId;
  }
}
//toàn cục
export const conversationController = new ConversationController();
