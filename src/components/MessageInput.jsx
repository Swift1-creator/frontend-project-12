import { Textarea, Button, Group, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';

export const MessageInput = ({
  value,
  onChange,
  onSubmit,
  isPending,
  placeholder = 'Введите сообщение',
}) => {
  const schema = yup.object({
    body: yup.string().trim().required('Введите сообщение'),
  });

  const form = useForm({
    initialValues: {
      body: value || '',
    },
    validate: yupResolver(schema),
  });

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values.body);
    form.reset();
  });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      mt="md"
    >
      <Group align="flex-end" wrap="nowrap">
        <Textarea
          style={{ flex: 1 }}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.currentTarget.value);
            form.setFieldValue(
              'body',
              event.currentTarget.value
            );
          }}
          rows={1}
          minRows={1}
          autosize
        />

        <Button
          type="submit"
          loading={isPending}
        >
          Отправить
        </Button>
      </Group>
    </Box>
  );
};