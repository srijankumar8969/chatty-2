import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      console.log("Users response:", res.data);
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("chatDeleted", ({ by }) => {
      const currentSelected = get().selectedUser;
      // If the deleted conversation involves the currently selected user, clear it
      if (!currentSelected) return;

      // If the event was emitted by the other user or by this user, clear the conversation UI
      if (by === currentSelected._id || by === useAuthStore.getState().authUser?._id) {
        set({ messages: [], selectedUser: null });
        // notify user
        import("react-hot-toast").then(({ default: toast }) => toast.success("Conversation deleted"));
      }
    });

    // When a message is deleted, remove it from the current messages list
    socket.on("messageDeleted", ({ messageId }) => {
      set(({ messages }) => ({ messages: messages.filter((m) => m._id !== messageId) }));
      import("react-hot-toast").then(({ default: toast }) => toast.success("Message deleted"));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("chatDeleted");
  },

  deleteChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/${userId}`);
      set({ messages: [], selectedUser: null });
      import("react-hot-toast").then(({ default: toast }) => toast.success("Conversation deleted"));
    } catch (err) {
      import("react-hot-toast").then(({ default: toast }) => toast.error(err?.response?.data?.message || "Failed to delete conversation"));
      throw err;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/message/${messageId}`);
      // remove message locally
      set(({ messages }) => ({ messages: messages.filter((m) => m._id !== messageId) }));
      import("react-hot-toast").then(({ default: toast }) => toast.success("Message deleted"));
    } catch (err) {
      import("react-hot-toast").then(({ default: toast }) => toast.error(err?.response?.data?.message || "Failed to delete message"));
      throw err;
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
