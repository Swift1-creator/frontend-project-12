import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Group,
  Title,
  Text,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { yupResolver } from 'mantine-form-yup-resolver';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import * as yup from 'yup';

import {
  fetchChannels,
  fetchMessages,
  createChannel,
  updateChannel,
  deleteChannel,
  sendMessage,
} from '../api.js';

import { getToken } from '../auth.js';
import { ChatSidebar } from '../components/ChatSidebar.jsx';
import { MessageList } from '../components/MessageList.jsx';
import { MessageInput } from '../components/MessageInput.jsx';
import { ChannelModals } from '../components/ChannelModals.jsx';
import { useChatStore } from '../store.js';

const ChatPage = () => {
  const { t } = useTranslation();
  const token = getToken();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  const [messageText, setMessageText] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);

  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);

  const [
    editModalOpened,
    { open: openEditModal, close: closeEditModal },
  ] = useDisclosure(false);

  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  const currentChannelId = useChatStore(
    (state) => state.currentChannelId,
  );

  const setCurrentChannelId = useChatStore(
    (state) => state.setCurrentChannelId,
  );

  const channelsQuery = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
    enabled: Boolean(token),
  });

  const messagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
    enabled: Boolean(token),
  });

  const channels = channelsQuery.data || [];
  const messages = messagesQuery.data || [];

  const currentMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        String(message.channelId) === String(currentChannelId),
    );
  }, [messages, currentChannelId]);

  const createChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(2, 'Минимум 2 символа')
      .max(50, 'Максимум 50 символов')
      .required('Введите название канала'),
  });

  const editChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(2, 'Минимум 2 символа')
      .max(50, 'Максимум 50 символов')
      .required('Введите название канала'),
  });

  const createForm = useForm({
    initialValues: { name: '' },
    validate: yupResolver(createChannelSchema),
  });

  const editForm = useForm({
    initialValues: { name: '' },
    validate: yupResolver(editChannelSchema),
  });

  const createMutation = useMutation({
    mutationFn: createChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      createForm.reset();
      closeCreateModal();
    },
  });

  const editMutation = useMutation({
    mutationFn: updateChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      setEditingChannel(null);
      editForm.reset();
      closeEditModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteChannel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      setChannelToDelete(null);
      closeDeleteModal();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: async () => {
      setMessageText('');

      await queryClient.invalidateQueries({
        queryKey: ['messages'],
      });
    },
  });

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io('/', {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket подключён:', socket.id);
      setIsSocketConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения Socket.IO:', error.message);
      setIsSocketConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket отключён:', reason);
      setIsSocketConnected(false);
    });

    const refreshData = () => {
      queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      queryClient.invalidateQueries({
        queryKey: ['messages'],
      });
    };

    const events = [
      'newChannel',
      'channelCreated',
      'channelUpdated',
      'channelRemoved',
      'channelDeleted',
      'newMessage',
      'messageCreated',
    ];

    events.forEach((eventName) => {
      socket.on(eventName, refreshData);
    });

    return () => {
      events.forEach((eventName) => {
        socket.off(eventName, refreshData);
      });

      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateSubmit = createForm.onSubmit((values) => {
    createMutation.mutate({
      name: values.name.trim(),
    });
  });

  const handleEditSubmit = editForm.onSubmit((values) => {
    if (!editingChannel) {
      return;
    }

    editMutation.mutate({
      id: editingChannel.id,
      name: values.name.trim(),
    });
  });

  const handleDelete = () => {
    if (!channelToDelete) {
      return;
    }

    deleteMutation.mutate(channelToDelete.id);
  };

  const handleSendMessage = (body) => {
    if (!currentChannelId) {
      return;
    }

    sendMessageMutation.mutate({
      channelId: currentChannelId,
      body,
    });
  };

  return (
    <Box
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Box
        p="md"
        style={{
          width: 280,
          minWidth: 0,
          borderRight: '1px solid #dee2e6',
        }}
      >
        <Group
          justify="space-between"
          wrap="nowrap"
          mb="md"
        >
          <Title order={2}>
            {t('chat.channels')}
          </Title>

          <Button
            size="compact-sm"
            variant="light"
            onClick={openCreateModal}
          >
            + {t('chat.addChannel')}
          </Button>
        </Group>

        <ChatSidebar
          channels={channels}
          currentChannelId={currentChannelId}
          onChangeChannel={setCurrentChannelId}
          onOpenEdit={(channel) => {
            setEditingChannel(channel);
            editForm.setValues({
              name: channel.name,
            });
            openEditModal();
          }}
          onOpenDelete={(channel) => {
            setChannelToDelete(channel);
            openDeleteModal();
          }}
        />
      </Box>

      <Box
        p="md"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Group justify="space-between">
          <Title order={2}>
            {t('chat.messages')}
          </Title>

          <Text
            size="sm"
            c={isSocketConnected ? 'green' : 'red'}
          >
            {isSocketConnected
              ? t('chat.connectionEstablished')
              : t('chat.noConnection')}
          </Text>
        </Group>

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <MessageList
            messages={currentMessages}
            currentUser={t('chat.defaultUser')}
          />
        </Box>

        <MessageInput
          value={messageText}
          onChange={setMessageText}
          onSubmit={handleSendMessage}
          isPending={sendMessageMutation.isPending}
          placeholder={t('chat.messagePlaceholder')}
        />
      </Box>

      <ChannelModals
        createModalOpened={createModalOpened}
        closeCreateModal={closeCreateModal}
        createForm={createForm}
        handleCreateSubmit={handleCreateSubmit}
        isCreating={createMutation.isPending}
        editModalOpened={editModalOpened}
        closeEditModal={closeEditModal}
        editForm={editForm}
        handleEditSubmit={handleEditSubmit}
        isEditing={editMutation.isPending}
        deleteModalOpened={deleteModalOpened}
        closeDeleteModal={closeDeleteModal}
        channelToDelete={channelToDelete}
        handleDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </Box>
  );
};

export default ChatPage;