import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';

import { getToken } from '../auth.js';

const SignupPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = getToken();

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (
      !normalizedUsername
      || !password
      || !passwordConfirmation
    ) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    if (
      normalizedUsername.length < 3
      || normalizedUsername.length > 20
    ) {
      setError(
        'Имя пользователя должно содержать от 3 до 20 символов',
      );
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Пароли должны совпадать');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: normalizedUsername,
          password,
        }),
      });

      if (!response.ok) {
        let message = 'Не удалось зарегистрироваться';

        try {
          const data = await response.json();

          message = (
            data.message
            || data.error
            || message
          );
        } catch {
          // Ответ может быть не в JSON-формате
        }

        throw new Error(message);
      }

      /*
       * После регистрации переходим на страницу входа.
       * Не пытаемся получать токен: signup обычно его не возвращает.
       */
      navigate('/login', {
        replace: true,
        state: {
          message: 'Регистрация прошла успешно. Выполните вход.',
        },
      });
    } catch (requestError) {
      setError(
        requestError.message
        || 'Не удалось зарегистрироваться',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container size={420} w="100%">
        <Paper
          withBorder
          shadow="sm"
          p="xl"
          radius="md"
        >
          <Title order={2} ta="center" mb="xl">
            Регистрация
          </Title>

          <Box
            component="form"
            onSubmit={handleSubmit}
          >
            <Stack>
              <TextInput
                label="Имя пользователя"
                placeholder="От 3 до 20 символов"
                value={username}
                onChange={(event) => {
                  setUsername(event.currentTarget.value);
                }}
                autoComplete="username"
                disabled={isLoading}
              />

              <PasswordInput
                label="Пароль"
                placeholder="Не менее 6 символов"
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                }}
                autoComplete="new-password"
                disabled={isLoading}
              />

              <PasswordInput
                label="Подтверждение пароля"
                placeholder="Повторите пароль"
                value={passwordConfirmation}
                onChange={(event) => {
                  setPasswordConfirmation(
                    event.currentTarget.value,
                  );
                }}
                autoComplete="new-password"
                disabled={isLoading}
              />

              {error && (
                <Alert color="red">
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                Зарегистрироваться
              </Button>

              <Text ta="center" size="sm">
                Уже есть аккаунт?{' '}
                <Anchor component={Link} to="/login">
                  Войти
                </Anchor>
              </Text>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Center>
  );
};

export default SignupPage;