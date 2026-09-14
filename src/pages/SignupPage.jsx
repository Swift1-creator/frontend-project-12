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
import { useTranslation } from 'react-i18next';

import { registerUser } from '../api.js';
import { saveToken } from '../auth.js';

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      passwordConfirmation: '',
    },

    validate: {
      username: (value) => {
        const length = value.trim().length;

        return length >= 3 && length <= 20
          ? null
          : 'От 3 до 20 символов';
      },

      password: (value) => (
        value.length >= 6
          ? null
          : 'Не менее 6 символов'
      ),

      passwordConfirmation: (value, values) => {
        if (!value) {
          return t('auth.required');
        }

        return value === values.password
          ? null
          : 'Пароли должны совпадать';
      },
    },
  });

  const signupMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      const token = (
        data?.token
        || data?.accessToken
        || data?.access_token
      );

      if (token) {
        saveToken(token);
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
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
        {t('auth.signupTitle')}
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack>
          <TextInput
            id="username"
            label="Имя пользователя"
            aria-label="Имя пользователя"
            autoComplete="username"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            id="password"
            label="Пароль"
            aria-label="Пароль"
            autoComplete="new-password"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            id="passwordConfirmation"
            label="Подтвердите пароль"
            aria-label="Подтвердите пароль"
            autoComplete="new-password"
            required
            {...form.getInputProps('passwordConfirmation')}
          />

          {signupMutation.isError && (
            <Alert color="red" role="alert">
              {signupMutation.error?.message
                || 'Не удалось зарегистрироваться'}
            </Alert>
          )}

          <Button
            type="submit"
            loading={signupMutation.isPending}
          >
            {t('auth.signup')}
          </Button>

          <Button
            component={Link}
            to="/login"
            variant="subtle"
          >
            {t('auth.toLogin')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default SignupPage;