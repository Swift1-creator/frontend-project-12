import { useEffect, useRef, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

import {
  createChannel,
  deleteChannel,
  fetchChannels,
  fetchMessages,
  sendMessage,
  updateChannel,
} from '../api.js';
import { getToken } from '../auth.js';
import { cleanText } from '../profanity.js';
import { useChatStore } from '../store.js';
import { Sentry } from '../sentry.js';

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

  const captureChatError = (error, operation) => {
    Sentry.captureException(error, {
      tags: {
        area: 'chat',
        operation,
      },
    });
  };

  const showErrorNotification = (message) => {
    notifications.show({
      title: t('chat.notifications.operationError'),
      message,
      color: 'red',
    });
  };

  const showSuccessNotification = (message) => {
    notifications.show({
      title: message,
      message,
      color: 'green',
    });
  };

  const validateChannelName = (
    value,
    excludedChannelId = null,
  ) => {
    const name = value.trim();

    if (name.length < 3 || name.length > 20) {
      return t('chat.nameLength');
    }

    const duplicate = channels.some((channel) => (
      String(channel.id) !== String(excludedChannelId)
      && channel.name.trim().toLowerCase()
        === name.toLowerCase()
    ));

    if (duplicate) {
      return t('chat.duplicateName');
    }

    return null;
  };

  const createForm = useForm({
    initialValues: {
      name: '',
    },

    validate: {
      name: (value) => validateChannelName(value),
    },
  });

  const editForm = useForm({
    initialValues: {
      name: '',
    },

    validate: {
      name: (value) => (
        validateChannelName(value, editingChannel?.id)
      ),
    },
  });

  useEffect(() => {
    if (channelsQuery.error) {
      captureChatError(
        channelsQuery.error,
        'load-channels',
      );

      notifications.show({
        title: t('chat.notifications.loadError'),
        message: t('chat.loadError'),
        color: 'red',
      });
    }

    if (messagesQuery.error) {
      captureChatError(
        messagesQuery.error,
        'load-messages',
      );

      notifications.show({
        title: t('chat.notifications.loadError'),
        message: t('chat.loadError'),
        color: 'red',
      });
    }
  }, [
    channelsQuery.error,
    messagesQuery.error,
    t,
  ]);

  useEffect(() => {
    const handleOffline = () => {
      notifications.show({
        title: t('chat.notifications.offline'),
        message: t('chat.notifications.offline'),
        color: 'red',
      });
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      if (socket !== socketRef.current) {
        return;
      }

      setIsSocketConnected(true);

      console.log(
        'Socket.IO подключён:',
        socket.id,
      );
    };

    const handleDisconnect = (reason) => {
      if (socket !== socketRef.current) {
        return;
      }

      setIsSocketConnected(false);

      notifications.show({
        title: t('chat.notifications.offline'),
        message: t('chat.notifications.offline'),
        color: 'red',
      });

      console.log(
        'Socket.IO отключён:',
        reason,
      );
    };

    const handleConnectError = (error) => {
      if (socket !== socketRef.current) {
        return;
      }

      setIsSocketConnected(false);

      captureChatError(error, 'socket-connect');

      notifications.show({
        title: t('chat.notifications.offline'),
        message: error?.message
          || t('chat.notifications.offline'),
        color: 'red',
      });

      console.error(
        'Ошибка Socket.IO:',
        error?.message,
      );
    };

    const handleMessage = (data) => {
      const received = data?.data ?? data;

      const message = (
        received?.message
        || received?.data
        || received
      );

      if (!message?.id || !message?.channelId) {
        return;
      }

      queryClient.setQueryData(
        ['messages'],
        (currentMessages = []) => {
          const exists = currentMessages.some(
            (item) => String(item.id)
              === String(message.id),
          );

          if (exists) {
            return currentMessages;
          }

          return [...currentMessages, message];
        },
      );
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message', handleMessage);
    socket.on('newMessage', handleMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message', handleMessage);
      socket.off('newMessage', handleMessage);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      socket.disconnect();
    };
  }, [token, queryClient, t]);

  const createChannelMutation = useMutation({
    mutationFn: createChannel,

    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      setCurrentChannelId(newChannel.id);
      createForm.reset();
      closeCreateModal();

      showSuccessNotification(
        t('chat.notifications.channelCreated'),
      );
    },

    onError: (error) => {
      captureChatError(error, 'create-channel');
      showErrorNotification(t('chat.createError'));
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: updateChannel,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      editForm.reset();
      setEditingChannel(null);
      closeEditModal();

      showSuccessNotification(
        t('chat.notifications.channelRenamed'),
      );
    },

    onError: (error) => {
      captureChatError(error, 'rename-channel');
      showErrorNotification(t('chat.renameError'));
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: deleteChannel,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['channels'],
      });

      queryClient.invalidateQueries({
        queryKey: ['messages'],
      });

      setChannelToDelete(null);
      closeDeleteModal();

      showSuccessNotification(
        t('chat.notifications.channelDeleted'),
      );
    },

    onError: (error) => {
      captureChatError(error, 'delete-channel');
      showErrorNotification(t('chat.deleteError'));
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,

    onSuccess: () => {
      setMessageText('');

      queryClient.invalidateQueries({
        queryKey: ['messages'],
      });
    },

    onError: (error) => {
      captureChatError(error, 'send-message');
      showErrorNotification(t('chat.sendError'));
    },
  });

  const currentMessages = messages.filter(
    (message) => (
      String(message.channelId)
      === String(currentChannelId)
    ),
  );

  const handleCreateSubmit = createForm.onSubmit((values) => {
    createChannelMutation.mutate({
      name: cleanText(values.name.trim()),
    });
  });

  const handleEditSubmit = editForm.onSubmit((values) => {
    if (!editingChannel) {
      return;
    }

    updateChannelMutation.mutate({
      id: editingChannel.id,
      name: cleanText(values.name.trim()),
    });
  });

  const handleMessageSubmit = (event) => {
    event.preventDefault();

    const body = cleanText(messageText.trim());

    if (
      !body
      || !currentChannelId
      || sendMessageMutation.isPending
    ) {
      return;
    }

    sendMessageMutation.mutate({
      body,
      channelId: currentChannelId,
    });
  };

  const handleOpenEdit = (channel) => {
    setEditingChannel(channel);

    editForm.setValues({
      name: channel.name,
    });

    openEditModal();
  };

  const handleOpenDelete = (channel) => {
    setChannelToDelete(channel);
    openDeleteModal();
  };

  const handleDelete = () => {
    if (!channelToDelete) {
      return;
    }

    deleteChannelMutation.mutate(channelToDelete.id);
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (
    channelsQuery.isLoading
    || messagesQuery.isLoading
  ) {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Loader />
      </Box>
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
        <Group justify="space-between" wrap="nowrap">
          <Title order={2}>
            {t('chat.channels')}
          </Title>

          <Button
            size="compact-sm"
            variant="light"
            onClick={openCreateModal}
          >
            +
            {' '}
            {t('chat.addChannel')}
          </Button>
        </Group>

        <Stack mt="md" gap={4}>
          {channels.map((channel) => {
            const isActive = (
              String(channel.id)
              === String(currentChannelId)
            );

            const canManage = channel.removable !== false;

            return (
              <Group
                key={channel.id}
                gap={4}
                wrap="nowrap"
              >
                <Button
                  variant={isActive ? 'light' : 'subtle'}
                  color={isActive ? 'blue' : 'gray'}
                  onClick={() => {
                    setCurrentChannelId(channel.id);
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text truncate>
                    #
                    {' '}
                    {cleanText(channel.name)}
                  </Text>
                </Button>

                {canManage && (
                  <Menu width={190} shadow="md">
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        px={8}
                        aria-label={channel.name}
                      >
                        ⋮
                      </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection="✎"
                        onClick={() => {
                          handleOpenEdit(channel);
                        }}
                      >
                        {t('chat.rename')}
                      </Menu.Item>

                      <Menu.Item
                        color="red"
                        leftSection="×"
                        onClick={() => {
                          handleOpenDelete(channel);
                        }}
                      >
                        {t('chat.delete')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            );
          })}
        </Stack>
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
            c={isSocketConnected ? 'green' : 'orange'}
          >
            {isSocketConnected
              ? t('chat.connectionEstablished')
              : t('chat.noConnection')}
          </Text>
        </Group>

        <ScrollArea
          mt="md"
          style={{
            flex: 1,
            minHeight: 0,
          }}
        >
          <Stack>
            {currentMessages.map((message) => (
              <Box
                key={message.id}
                style={{
                  overflowWrap: 'anywhere',
                }}
              >
                <Text fw={700}>
                  {message.username || t('chat.defaultUser')}
                </Text>

                <Text>
                  {cleanText(message.body)}
                </Text>
              </Box>
            ))}
          </Stack>
        </ScrollArea>

        <Box
          component="form"
          onSubmit={handleMessageSubmit}
          mt="md"
        >
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              style={{ flex: 1 }}
              value={messageText}
              onChange={(event) => {
                setMessageText(event.currentTarget.value);
              }}
              placeholder={t('chat.messagePlaceholder')}
              disabled={sendMessageMutation.isPending}
            />

            <Button
              type="submit"
              loading={sendMessageMutation.isPending}
            >
              {t('chat.send')}
            </Button>
          </Group>
        </Box>
      </Box>

      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title={t('chat.createChannel')}
        centered
      >
        <Box
          component="form"
          onSubmit={handleCreateSubmit}
        >
          <TextInput
            label={t('chat.channelName')}
            placeholder={t('chat.channelPlaceholder')}
            data-autofocus
            {...createForm.getInputProps('name')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={closeCreateModal}
              disabled={createChannelMutation.isPending}
            >
              {t('chat.cancel')}
            </Button>

            <Button
              type="submit"
              loading={createChannelMutation.isPending}
            >
              {t('chat.createChannel')}
            </Button>
          </Group>
        </Box>
      </Modal>

      <Modal
        opened={editModalOpened}
        onClose={() => {
          closeEditModal();
          setEditingChannel(null);
        }}
        title={t('chat.renameChannel')}
        centered
      >
        <Box
          component="form"
          onSubmit={handleEditSubmit}
        >
          <TextInput
            label={t('chat.newChannelName')}
            data-autofocus
            {...editForm.getInputProps('name')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={closeEditModal}
              disabled={updateChannelMutation.isPending}
            >
              {t('chat.cancel')}
            </Button>

            <Button
              type="submit"
              loading={updateChannelMutation.isPending}
            >
              {t('chat.save')}
            </Button>
          </Group>
        </Box>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          closeDeleteModal();
          setChannelToDelete(null);
        }}
        title={t('chat.deleteChannel')}
        centered
      >
        <Text>
          {t('chat.deleteConfirmation', {
            name: cleanText(channelToDelete?.name),
          })}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={closeDeleteModal}
            disabled={deleteChannelMutation.isPending}
          >
            {t('chat.cancel')}
          </Button>

          <Button
            color="red"
            onClick={handleDelete}
            loading={deleteChannelMutation.isPending}
          >
            {t('chat.delete')}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default ChatPage;