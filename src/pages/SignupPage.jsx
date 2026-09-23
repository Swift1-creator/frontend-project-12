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

import { registerUser } from '../api.js';
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

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validationSchema = yup.object({
    username: yup
      .string()
      .trim()
      .required(t('auth.required'))
      .min(3, 'От 3 до 20 символов')
      .max(20, 'От 3 до 20 символов'),

    password: yup
      .string()
      .required(t('auth.required'))
      .min(6, 'Не менее 6 символов'),

    passwordConfirmation: yup
      .string()
      .required(t('auth.required'))
      .oneOf(
        [yup.ref('password')],
        'Пароли должны совпадать',
      ),
  });

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      passwordConfirmation: '',
    },
    validate: yupResolver(validationSchema),
  });

  const signupMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (response) => {
      const token = getTokenFromResponse(response);

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
      <Title
        order={1}
        mb="xl"
        fw={700}
        c="dark"
      >
        {t('auth.signupTitle')}
      </Title>

      <Box
        component="form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Stack>
          <TextInput
            id="username"
            label="Имя пользователя"
            aria-label="Имя пользователя"
            autoComplete="off"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            id="password"
            label="Пароль"
            aria-label="Пароль"
            autoComplete="off"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            id="passwordConfirmation"
            label="Подтвердите пароль"
            aria-label="Подтвердите пароль"
            autoComplete="off"
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
            fw={600}
          >
            {t('auth.toLogin')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default SignupPage;