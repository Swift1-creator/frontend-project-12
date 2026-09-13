import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';

import { registerUser } from '../api.js';

const SignupPage = () => {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      passwordConfirmation: '',
    },

    validate: {
      username: (value) => (
        value.trim().length > 0
          ? null
          : 'Введите имя пользователя'
      ),

      password: (value) => (
        value.length > 0
          ? null
          : 'Введите пароль'
      ),

      passwordConfirmation: (value, values) => {
        if (value.length === 0) {
          return 'Подтвердите пароль';
        }

        if (value !== values.password) {
          return 'Пароли не совпадают';
        }

        return null;
      },
    },
  });

  const signupMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: () => {
      navigate('/login', {
        replace: true,
      });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    signupMutation.mutate({
      username: values.username.trim(),
      password: values.password,
    });
  });

  return (
    <Box
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: 24,
      }}
    >
      <Title order={1} mb="xl">
        Регистрация
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        <Stack>
          <TextInput
            id="username"
            name="username"
            label="Имя пользователя"
            placeholder="Введите имя пользователя"
            autoComplete="username"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Пароль"
            placeholder="Введите пароль"
            autoComplete="new-password"
            required
            {...form.getInputProps('password')}
            aria-label="Пароль"
          />

          <PasswordInput
            id="passwordConfirmation"
            name="passwordConfirmation"
            label="Подтвердите пароль"
            placeholder="Повторите пароль"
            autoComplete="new-password"
            required
            {...form.getInputProps('passwordConfirmation')}
            aria-label="Подтвердите пароль"
          />

          {signupMutation.isError && (
            <Alert
              color="red"
              role="alert"
            >
              Не удалось зарегистрироваться.
            </Alert>
          )}

          <Button
            type="submit"
            loading={signupMutation.isPending}
          >
            Зарегистрироваться
          </Button>

          <Button
            component={Link}
            to="/login"
            variant="subtle"
          >
            Войти
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default SignupPage;