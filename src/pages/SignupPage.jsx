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

        if (length < 3 || length > 20) {
          return t('auth.usernameLength');
        }

        return null;
      },

      password: (value) => (
        value.length >= 6
          ? null
          : t('auth.passwordLength')
      ),

      passwordConfirmation: (value, values) => {
        if (value.length === 0) {
          return t('auth.required');
        }

        if (value !== values.password) {
          return t('auth.passwordMismatch');
        }

        return null;
      },
    },
  });

  const signupMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      const receivedToken = (
        data?.token
        || data?.accessToken
        || data?.access_token
      );

      if (receivedToken) {
        saveToken(receivedToken);

        navigate('/', {
          replace: true,
        });

        return;
      }

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

  const errorMessage = signupMutation.error?.message;

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
            label={t('auth.password')}
            placeholder={t('auth.password')}
            autoComplete="new-password"
            required
            {...form.getInputProps('password')}
            aria-label={t('auth.password')}
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
              {errorMessage === 'Такой пользователь уже существует'
                ? t('auth.duplicateUser')
                : t('auth.signupError')}
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