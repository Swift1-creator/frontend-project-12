import { Button, Group, Text, Menu } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const ChatSidebar = ({
  channels,
  currentChannelId,
  onChangeChannel,
  onOpenEdit,
  onOpenDelete,
  canManage = true,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {channels.map((channel) => {
        const isActive = String(channel.id) === String(currentChannelId);
        const canManageChannel = channel.removable !== false;

        return (
          <Group key={channel.id} gap={4} wrap="nowrap">
            <Button
              variant={isActive ? 'light' : 'subtle'}
              color={isActive ? 'blue' : 'gray'}
              onClick={() => onChangeChannel(channel.id)}
              style={{
                flex: 1,
                minWidth: 0,
                justifyContent: 'flex-start',
              }}
            >
              <Text truncate># {channel.name}</Text>
            </Button>

            {canManage && canManageChannel && (
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
                  <Menu.Item onClick={() => onOpenEdit(channel)}>
                    {t('chat.rename')}
                  </Menu.Item>

                  <Menu.Item
                    color="red"
                    onClick={() => onOpenDelete(channel)}
                  >
                    {t('chat.delete')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        );
      })}
    </div>
  );
};