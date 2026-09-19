import {
  Modal,
  TextInput,
  Group,
  Button,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const ChannelModals = ({
  createModalOpened,
  closeCreateModal,
  createForm,
  handleCreateSubmit,
  isCreating,

  editModalOpened,
  closeEditModal,
  editForm,
  handleEditSubmit,
  isEditing,

  deleteModalOpened,
  closeDeleteModal,
  channelToDelete,
  handleDelete,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title={t('chat.createChannel')}
        centered
      >
        <form onSubmit={handleCreateSubmit}>
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
            >
              {t('chat.cancel')}
            </Button>

            <Button
              type="submit"
              loading={isCreating}
            >
              {t('chat.createChannel')}
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={t('chat.renameChannel')}
        centered
      >
        <form onSubmit={handleEditSubmit}>
          <TextInput
            label="Имя канала"
            data-autofocus
            {...editForm.getInputProps('name')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={closeEditModal}
            >
              {t('chat.cancel')}
            </Button>

            <Button
              type="submit"
              loading={isEditing}
            >
              {t('chat.save')}
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t('chat.deleteChannel')}
        centered
      >
        <Text>
          Вы действительно хотите удалить канал
          {channelToDelete
            ? ` «${channelToDelete.name}»`
            : ''}
          ?
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={closeDeleteModal}
          >
            {t('chat.cancel')}
          </Button>

          <Button
            color="red"
            onClick={handleDelete}
            loading={isDeleting}
          >
            {t('chat.delete')}
          </Button>
        </Group>
      </Modal>
    </>
  );
};