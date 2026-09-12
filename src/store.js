import { create } from 'zustand';

export const useChatStore = create((set) => ({
  currentChannelId: '1',
  isModalOpen: false,

  setCurrentChannelId: (channelId) => {
    set({ currentChannelId: String(channelId) });
  },

  openModal: () => {
    set({ isModalOpen: true });
  },

  closeModal: () => {
    set({ isModalOpen: false });
  },
}));