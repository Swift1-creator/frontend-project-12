import { getToken } from './auth.js';

const getHeaders = () => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
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
    let errorMessage = 'Ошибка запроса';

    try {
      const data = await response.json();

      errorMessage = (
        data.message
        || data.error
        || errorMessage
      );
    } catch {
      // Ответ может быть пустым
    }

    if (response.status === 401) {
      errorMessage = 'Сессия истекла. Войдите снова.';
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const loginUser = async ({
  username,
  password,
}) => {
  const response = await fetch('/api/v1/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Не удалось войти';

    try {
      const data = await response.json();

      errorMessage = (
        data.message
        || data.error
        || errorMessage
      );
    } catch {
      // Ответ может быть пустым
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

export const fetchChannels = () => (
  request('/api/v1/channels')
);

export const fetchMessages = () => (
  request('/api/v1/messages')
);

export const sendMessage = ({
  body,
  channelId,
}) => (
  request('/api/v1/messages', {
    method: 'POST',
    body: JSON.stringify({
      body,
      channelId,
    }),
  })
);

export const createChannel = ({ name }) => (
  request('/api/v1/channels', {
    method: 'POST',
    body: JSON.stringify({
      name,
    }),
  })
);

export const updateChannel = ({
  id,
  name,
}) => (
  request(`/api/v1/channels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name,
    }),
  })
);

export const deleteChannel = (id) => (
  request(`/api/v1/channels/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({}),
  })
);