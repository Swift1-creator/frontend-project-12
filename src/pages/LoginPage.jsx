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

const getTokenFromResponse = (response) => (
  response?.token
  || response?.accessToken
  || response?.access_token
  || response?.data?.token
  || response?.data?.accessToken
  || response?.data?.access_token
  || response?.user?.token
  || response?.data?.user?.token
);

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
      <Title order={1} mb="xl">
        {t('auth.loginTitle')}
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack>
          <TextInput
            id="username"
            label={t('auth.username')}
            aria-label={t('auth.username')}
            autoComplete="username"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            id="password"
            label={t('auth.password')}
            aria-label={t('auth.password')}
            autoComplete="current-password"
            required
            {...form.getInputProps('password')}
          />

          {loginMutation.isError && (
            <Alert color="red" role="alert">
              {t('auth.loginError')}
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
          >
            {t('auth.toSignup')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginPage;