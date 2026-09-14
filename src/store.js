import { create } from 'zustand';

export const useChatStore = create((set) => ({
  currentChannelId: null,

  setCurrentChannelId: (channelId) => {
    set({ currentChannelId: String(channelId) });
  },
}));