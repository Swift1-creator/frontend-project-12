import { getToken } from './auth.js';

const getHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseError = async (
  response,
  defaultMessage = 'Ошибка запроса',
  statusMessages = {},
) => {
  let errorMessage = defaultMessage;

  try {
    const data = await response.json();
    errorMessage = data.message || data.error || errorMessage;
  } catch {
    // Ответ может быть пустым или не содержать JSON.
  }

  return statusMessages[response.status] || errorMessage;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const authRequest = async (
  url,
  body,
  defaultMessage,
  statusMessages = {},
) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, defaultMessage, statusMessages),
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const loginUser = ({ username, password }) => authRequest(
  '/api/v1/login',
  { username, password },
  'Не удалось войти',
  { 401: 'Неверные имя пользователя или пароль' },
);

export const registerUser = ({ username, password }) => authRequest(
  '/api/v1/signup',
  { username, password },
  'Не удалось зарегистрироваться',
  { 409: 'Такой пользователь уже существует' },
);

export const fetchChannels = () => request('/api/v1/channels');
export const fetchMessages = () => request('/api/v1/messages');

export const sendMessage = ({ body, channelId }) => request(
  '/api/v1/messages',
  {
    method: 'POST',
    body: JSON.stringify({ body, channelId }),
  },
);

export const createChannel = ({ name }) => request(
  '/api/v1/channels',
  {
    method: 'POST',
    body: JSON.stringify({ name }),
  },
);

export const updateChannel = ({ id, name }) => request(
  `/api/v1/channels/${id}`,
  {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  },
);

export const deleteChannel = (id) => request(
  `/api/v1/channels/${id}`,
  { method: 'DELETE' },
);