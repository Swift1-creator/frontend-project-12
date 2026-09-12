import { useEffect } from 'react';
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

import { loginUser } from '../api.js';
import { getToken, saveToken } from '../auth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const token = getToken();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
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
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      console.log('Ответ сервера при входе:', data);

      const receivedToken = (
        data.token
        || data.accessToken
        || data.access_token
      );

      if (!receivedToken) {
        console.error('Токен отсутствует в ответе сервера:', data);
        return;
      }

      saveToken(receivedToken);

      navigate('/', {
        replace: true,
      });
    },
  });

  useEffect(() => {
    if (token) {
      navigate('/', {
        replace: true,
      });
    }
  }, [token, navigate]);

  const handleSubmit = form.onSubmit((values) => {
    loginMutation.mutate({
      username: values.username.trim(),
      password: values.password,
    });
  });

  if (token) {
    return null;
  }

  return (
    <Box
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: 24,
      }}
    >
      <Title order={1} mb="xl">
        Вход
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack>
          <TextInput
            label="Имя пользователя"
            placeholder="Введите имя пользователя"
            {...form.getInputProps('username')}
          />

          <PasswordInput
            label="Пароль"
            placeholder="Введите пароль"
            {...form.getInputProps('password')}
          />

          {loginMutation.isError && (
            <Alert color="red">
              Не удалось войти. Проверьте имя пользователя и пароль.
            </Alert>
          )}

          <Button
            type="submit"
            loading={loginMutation.isPending}
          >
            Войти
          </Button>

          <Button
            component={Link}
            to="/signup"
            variant="subtle"
          >
            Создать аккаунт
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginPage;