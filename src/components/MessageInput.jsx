import { Button, Group, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const MessageInput = ({
  value,
  onChange,
  onSubmit,
  isPending = false,
  placeholder,
}) => {
  const { t } = useTranslation();

  const handleSubmit = (event) => {
    event.preventDefault();

    const body = value.trim();

    if (!body || isPending) {
      return;
    }

    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group align="flex-end" wrap="nowrap">
        <Textarea
          autoFocus
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          aria-label="Новое сообщение"
          autosize
          minRows={1}
          maxRows={5}
          style={{ flex: 1 }}
        />

        <Button
          type="submit"
          loading={isPending}
          disabled={!value.trim()}
        >
          {t('chat.send')}
        </Button>
      </Group>
    </form>
  );
};