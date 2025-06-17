import { MyConversationContext } from "../bot";

export async function deleteMessage(ctx: MyConversationContext) {
  try {
    await ctx?.api.deleteMessage(ctx.chatId!, ctx.msgId!);
  } catch (error) {
    console.error("Не удалось удалить сообщение: ", error);
  }
}
