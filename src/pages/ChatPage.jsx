import { useEffect, useState } from 'react';
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
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
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

  const [messageText, setMessageText] = useState('');
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

  useEffect(() => {
    if (!channels.length) return;

    const exists = channels.some(
      (channel) => String(channel.id) === String(currentChannelId),
    );

    if (!exists) {
      setCurrentChannelId(channels[0].id);
    }
  }, [channels, currentChannelId, setCurrentChannelId]);

  const captureChatError = (error, operation) => {
    if (Sentry?.captureException) {
      Sentry.captureException(error, {
        tags: {
          area: 'chat',
          operation,
        },
      });
    }
  };

  const showErrorNotification = (message) => {
    notifications.show({
      title: 'Ошибка операции',
      message,
      color: 'red',
    });
  };

  const showSuccessNotification = (message) => {
    notifications.show({
      id: `chat-success-${Date.now()}`,
      title: message,
      message,
      color: 'green',
      autoClose: 5000,
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

    const duplicate = channels.some(
      (channel) => (
        String(channel.id) !== String(excludedChannelId)
        && channel.name.trim().toLowerCase() === name.toLowerCase()
      ),
    );

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

  const createChannelMutation = useMutation({
    mutationFn: createChannel,

    onSuccess: (newChannel) => {
      queryClient.refetchQueries({
        queryKey: ['channels'],
      });

      if (newChannel?.id) {
        setCurrentChannelId(newChannel.id);
      }

      createForm.reset();
      closeCreateModal();
      showSuccessNotification('Канал создан');
    },

    onError: (error) => {
      captureChatError(error, 'create-channel');
      showErrorNotification('Не удалось создать канал');
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: updateChannel,

    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ['channels'],
      });

      editForm.reset();
      setEditingChannel(null);
      closeEditModal();
      showSuccessNotification('Канал переименован');
    },

    onError: (error) => {
      captureChatError(error, 'rename-channel');
      showErrorNotification('Не удалось переименовать канал');
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: deleteChannel,

    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ['channels'],
      });

      queryClient.refetchQueries({
        queryKey: ['messages'],
      });

      setChannelToDelete(null);
      closeDeleteModal();
      showSuccessNotification('Канал удалён');
    },

    onError: (error) => {
      captureChatError(error, 'delete-channel');
      showErrorNotification('Не удалось удалить канал');
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
      showErrorNotification('Не удалось отправить сообщение');
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
    if (!editingChannel) return;

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

  const handleCloseDeleteModal = () => {
    closeDeleteModal();
    setChannelToDelete(null);
  };

  const handleDelete = () => {
    if (
      !channelToDelete
      || deleteChannelMutation.isPending
    ) {
      return;
    }

    deleteChannelMutation.mutate(channelToDelete.id);
  };

  if (!token) {
    return <Navigate to="/login" replace />;
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
            + {t('chat.addChannel')}
          </Button>
        </Group>

        <Stack mt="md" gap={4}>
          {channels.map((channel) => {
            const isActive = (
              String(channel.id)
              === String(currentChannelId)
            );

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
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text truncate>
                    # {channel.name}
                  </Text>
                </Button>

                {channel.removable !== false && (
                  <Menu width={190} shadow="md">
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        px={8}
                        aria-label="Управление каналом"
                      >
                        ⋮
                      </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item
                        onClick={() => handleOpenEdit(channel)}
                      >
                        {t('chat.rename')}
                      </Menu.Item>

                      <Menu.Item
                        color="red"
                        onClick={() => handleOpenDelete(channel)}
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Title order={2}>
          {t('chat.messages')}
        </Title>

        <ScrollArea
          mt="md"
          style={{
            flex: 1,
          }}
        >
          <Stack>
            {currentMessages.map((message) => (
              <Box key={message.id}>
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
            <Textarea
              id="message-input"
              name="body"
              label="Новое сообщение"
              placeholder={t('chat.messagePlaceholder')}
              style={{ flex: 1 }}
              autosize
              minRows={1}
              maxRows={4}
              value={messageText}
              onChange={(event) => {
                setMessageText(event.currentTarget.value);
              }}
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
            label="Имя канала"
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
            label="Имя канала"
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
        onClose={handleCloseDeleteModal}
        title={t('chat.deleteChannel')}
        centered
      >
        <Text>
          {t('chat.deleteConfirmation', {
            name: cleanText(channelToDelete?.name || ''),
          })}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={handleCloseDeleteModal}
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