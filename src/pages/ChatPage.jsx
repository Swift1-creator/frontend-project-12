import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Group,
  Loader,
  Text,
  Title,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { yupResolver } from 'mantine-form-yup-resolver';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

const normalizeResponse = (response) => (
  response?.data ?? response
);

const censorChannelName = (name) => {
  if (typeof name !== 'string') {
    return name;
  }

  return name
    .replace(/boobs/gi, '*****')
    .replace(/fuck/gi, '*****')
    .replace(/shit/gi, '*****')
    .replace(/bitch/gi, '*****');
};

const normalizeChannels = (response) => {
  const data = normalizeResponse(response);

  let channels = [];

  if (Array.isArray(data)) {
    channels = data;
  } else if (Array.isArray(data?.channels)) {
    channels = data.channels;
  } else if (Array.isArray(data?.data)) {
    channels = data.data;
  }

  return channels.map((channel) => ({
    ...channel,
    name: censorChannelName(channel.name ?? ''),
  }));
};

const normalizeMessages = (response) => {
  const data = normalizeResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.messages)) {
    return data.messages;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const normalizeChannel = (response) => {
  const data = normalizeResponse(response);
  const channel = data?.channel ?? data?.data ?? data;

  if (
    !channel
    || typeof channel !== 'object'
    || Array.isArray(channel)
  ) {
    return null;
  }

  return {
    ...channel,
    name: censorChannelName(channel.name ?? ''),
  };
};

const ChatPage = () => {
  const { t } = useTranslation();
  const token = getToken();
  const queryClient = useQueryClient();

const socketRef = useRef(null);
const skipChannelRefreshRef = useRef(false);
const skipChannelRefreshTimerRef = useRef(null);

  const [messageText, setMessageText] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);

  const [
    createModalOpened,
    {
      open: openCreateModal,
      close: closeCreateModal,
    },
  ] = useDisclosure(false);

  const [
    editModalOpened,
    {
      open: openEditModal,
      close: closeEditModal,
    },
  ] = useDisclosure(false);

  const [
    deleteModalOpened,
    {
      open: openDeleteModal,
      close: closeDeleteModal,
    },
  ] = useDisclosure(false);

  const currentChannelId = useChatStore(
    (state) => state.currentChannelId,
  );

  const setCurrentChannelId = useChatStore(
    (state) => state.setCurrentChannelId,
  );

  const channelsQuery = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await fetchChannels();

      return normalizeChannels(response);
    },
    enabled: Boolean(token),
  });

  const messagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetchMessages();

      return normalizeMessages(response);
    },
    enabled: Boolean(token),
  });

  const channels = channelsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    if (channels.length === 0) {
      if (currentChannelId !== null) {
        setCurrentChannelId(null);
      }

      return;
    }

    const currentChannelExists = channels.some(
      (channel) => (
        String(channel.id) === String(currentChannelId)
      ),
    );

    if (!currentChannelExists) {
      setCurrentChannelId(channels[0].id);
    }
  }, [
    channels,
    currentChannelId,
    setCurrentChannelId,
  ]);

  const currentMessages = useMemo(
    () => messages.filter(
      (message) => (
        String(message.channelId)
        === String(currentChannelId)
      ),
    ),
    [messages, currentChannelId],
  );

  const channelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, 'От 3 до 20 символов')
      .max(20, 'От 3 до 20 символов')
      .required('От 3 до 20 символов'),
  });

  const createForm = useForm({
    initialValues: {
      name: '',
    },
    validate: yupResolver(channelSchema),
  });

  const editForm = useForm({
    initialValues: {
      name: '',
    },
    validate: yupResolver(channelSchema),
  });

  const createMutation = useMutation({
    mutationFn: createChannel,

    onSuccess: (response) => {
      const createdChannel = normalizeChannel(response);

      if (createdChannel?.id !== undefined) {
        queryClient.setQueryData(
          ['channels'],
          (oldChannels = []) => {
            const channelExists = oldChannels.some(
              (channel) => (
                String(channel.id)
                === String(createdChannel.id)
              ),
            );

            if (channelExists) {
              return oldChannels.map((channel) => (
                String(channel.id)
                === String(createdChannel.id)
                  ? createdChannel
                  : channel
              ));
            }

            return [...oldChannels, createdChannel];
          },
        );

        setCurrentChannelId(createdChannel.id);
      }

      createForm.reset();
      closeCreateModal();

      notifications.show({
        title: 'Канал создан',
        message: 'Канал успешно создан',
        color: 'green',
      });
    },

    onError: (error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать канал',
        color: 'red',
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: updateChannel,

    onSuccess: (response) => {
      const updatedChannel = normalizeChannel(response);

      if (updatedChannel?.id !== undefined) {
        queryClient.setQueryData(
          ['channels'],
          (oldChannels = []) => (
            oldChannels.map((channel) => (
              String(channel.id)
              === String(updatedChannel.id)
                ? {
                  ...channel,
                  ...updatedChannel,
                  name: censorChannelName(
                    updatedChannel.name ?? channel.name,
                  ),
                }
                : channel
            ))
          ),
        );
      }

      setEditingChannel(null);
      editForm.reset();
      closeEditModal();

      notifications.show({
        title: 'Канал переименован',
        message: 'Название канала изменено',
        color: 'green',
      });
    },

    onError: (error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось переименовать канал',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
  mutationFn: deleteChannel,

  onMutate: async (deletedId) => {
    await queryClient.cancelQueries({
      queryKey: ['channels'],
    });

    const previousChannels = queryClient.getQueryData([
      'channels',
    ]) ?? [];

    const remainingChannels = previousChannels.filter(
      (channel) => (
        String(channel.id)
        !== String(deletedId)
      ),
    );

    queryClient.setQueryData(
      ['channels'],
      remainingChannels,
    );

    if (
      String(currentChannelId)
      === String(deletedId)
    ) {
      setCurrentChannelId(
        remainingChannels[0]?.id ?? null,
      );

      setMessageText('');
    }

    setChannelToDelete(null);
    closeDeleteModal();

    notifications.show({
      title: 'Канал удалён',
      message: 'Канал успешно удалён',
      color: 'green',
      autoClose: false,
    });

    return {
      previousChannels,
    };
  },

  onError: (error, _deletedId, context) => {
    if (context?.previousChannels) {
      queryClient.setQueryData(
        ['channels'],
        context.previousChannels,
      );
    }

    notifications.show({
      title: 'Ошибка',
      message: error.message || 'Не удалось удалить канал',
      color: 'red',
    });
  },

  onSettled: () => {
    // invalidateQueries здесь не вызываем.
  },
});

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,

    onSuccess: () => {
      setMessageText('');
    },

    onError: (error) => {
      notifications.show({
        color: 'red',
        message: error.message || 'Не удалось отправить сообщение',
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

const refreshChannels = () => {
  if (skipChannelRefreshRef.current) {
    return;
  }

  queryClient.invalidateQueries({
    queryKey: ['channels'],
  });
};

    const refreshMessages = () => {
      queryClient.invalidateQueries({
        queryKey: ['messages'],
      });
    };

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error(
        'Ошибка подключения Socket.IO:',
        error.message,
      );

      setIsSocketConnected(false);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    const channelEvents = [
      'newChannel',
      'channelCreated',
      'channelUpdated',
      'channelRemoved',
      'channelDeleted',
    ];

    const messageEvents = [
      'newMessage',
      'messageCreated',
    ];

    channelEvents.forEach((eventName) => {
      socket.on(eventName, refreshChannels);
    });

    messageEvents.forEach((eventName) => {
      socket.on(eventName, refreshMessages);
    });

    return () => {
      channelEvents.forEach((eventName) => {
        socket.off(eventName, refreshChannels);
      });

      messageEvents.forEach((eventName) => {
        socket.off(eventName, refreshMessages);
      });

      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleChangeChannel = (channelId) => {
    setCurrentChannelId(channelId);
    setMessageText('');
  };

const skipChannelRefreshTemporarily = () => {
  skipChannelRefreshRef.current = true;

  if (skipChannelRefreshTimerRef.current) {
    clearTimeout(skipChannelRefreshTimerRef.current);
  }

  skipChannelRefreshTimerRef.current = setTimeout(() => {
    skipChannelRefreshRef.current = false;
    skipChannelRefreshTimerRef.current = null;
  }, 1000);
};

  const handleCreateSubmit = createForm.onSubmit(
    (values) => {
      skipChannelRefreshTemporarily();

      createMutation.mutate({
        name: values.name.trim(),
      });
    },
  );

  const handleEditSubmit = editForm.onSubmit(
    (values) => {
      if (!editingChannel) {
        return;
      }

      skipChannelRefreshTemporarily();

      editMutation.mutate({
        id: editingChannel.id,
        name: values.name.trim(),
      });
    },
  );

const handleDelete = () => {
  const deletedId = channelToDelete?.id;

  if (deletedId === undefined || deletedId === null) {
    return;
  }

  skipChannelRefreshTemporarily();

  deleteMutation.mutate(deletedId);
};

  const handleSendMessage = (body) => {
    const trimmedBody = body.trim();

    if (
      currentChannelId === null
      || currentChannelId === undefined
      || !trimmedBody
    ) {
      return;
    }

    sendMessageMutation.mutate({
      channelId: currentChannelId,
      body: trimmedBody,
    });
  };

  if (channelsQuery.isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

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

        {channelsQuery.isError ? (
          <Alert color="red" role="alert">
            Не удалось загрузить каналы
          </Alert>
        ) : (
          <ChatSidebar
            channels={channels}
            currentChannelId={currentChannelId}
            onChangeChannel={handleChangeChannel}
            onOpenEdit={(channel) => {
              setEditingChannel(channel);

              editForm.setValues({
                name: channel.name ?? '',
              });

              openEditModal();
            }}
            onOpenDelete={(channel) => {
              setChannelToDelete(channel);
              openDeleteModal();
            }}
            canManage
          />
        )}
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
          {messagesQuery.isLoading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : messagesQuery.isError ? (
            <Alert color="red" role="alert">
              Не удалось загрузить сообщения
            </Alert>
          ) : (
            <MessageList
              messages={currentMessages}
              currentUser={t('chat.defaultUser')}
            />
          )}
        </Box>

        <MessageInput
          value={messageText}
          onChange={setMessageText}
          onSubmit={handleSendMessage}
          isPending={sendMessageMutation.isPending}
          placeholder={t('chat.messagePlaceholder')}
          aria-label="Новое сообщение"
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