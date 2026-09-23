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
import { yupResolver } from 'mantine-form-yup-resolver';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { loginUser } from '../api.js';
import { saveToken } from '../auth.js';

const getTokenFromResponse = (response) => {
  const data = response?.data ?? response;

  return (
    data?.token
    || data?.accessToken
    || data?.access_token
    || data?.user?.token
    || data?.user?.accessToken
    || data?.user?.access_token
  );
};

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validationSchema = yup.object({
    username: yup
      .string()
      .trim()
      .required(t('auth.required')),
    password: yup
      .string()
      .required(t('auth.required')),
  });

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: yupResolver(validationSchema),
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (response) => {
      const token = getTokenFromResponse(response);

      if (!token) {
        console.error('Токен отсутствует в ответе login:', response);
        return;
      }

      saveToken(token);
      navigate('/', { replace: true });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    loginMutation.mutate({
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
      <Title order={1} mb="xl" fw={700} c="dark">
        {t('auth.loginTitle')}
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Stack>
          <TextInput
            id="username"
            label={t('auth.username')}
            aria-label={t('auth.username')}
            autoComplete="off"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            id="password"
            label={t('auth.password')}
            aria-label={t('auth.password')}
            autoComplete="off"
            required
            {...form.getInputProps('password')}
          />

          {loginMutation.isError && (
            <Alert color="red" role="alert">
              Неверные имя пользователя или пароль
            </Alert>
          )}

          <Button
            type="submit"
            loading={loginMutation.isPending}
          >
            {t('auth.login')}
          </Button>

          <Button
            component={Link}
            to="/signup"
            variant="subtle"
            fw={600}
          >
            {t('auth.toSignup')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginPage;