import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      app: {
        title: 'Hexlet Chat',
        logout: 'Выйти',
      },

      auth: {
        loginTitle: 'Войти',
        signupTitle: 'Регистрация',
        username: 'Ваш ник',
        password: 'Пароль',
        login: 'Войти',
        signup: 'Зарегистрироваться',
        noAccount: 'Нет аккаунта?',
        haveAccount: 'Уже есть аккаунт?',
        toSignup: 'Регистрация',
        toLogin: 'Войти',
        required: 'Обязательное поле',
        loginError: 'Неверное имя пользователя или пароль',
        signupError: 'Не удалось зарегистрироваться',
      },

      chat: {
        channels: 'Каналы',
        messages: 'Сообщения',
        addChannel: 'Добавить',
        channelName: 'Название канала',
        channelPlaceholder: 'Например, frontend',
        newChannelName: 'Новое название',
        createChannel: 'Добавить канал',
        renameChannel: 'Переименовать канал',
        deleteChannel: 'Удалить канал?',
        rename: 'Переименовать',
        delete: 'Удалить',
        save: 'Сохранить',
        cancel: 'Отмена',
        send: 'Отправить',
        messagePlaceholder: 'Введите сообщение',
        connectionEstablished: 'Соединение установлено',
        noConnection: 'Нет соединения',
        defaultUser: 'Пользователь',

        deleteConfirmation:
          'Канал «{{name}}» и его сообщения будут удалены.',

        createError: 'Не удалось создать канал',
        renameError: 'Не удалось переименовать канал',
        deleteError: 'Не удалось удалить канал',
        sendError: 'Не удалось отправить сообщение',
        loadError: 'Не удалось загрузить данные чата',

        nameLength:
          'Название должно содержать от 3 до 20 символов',

        duplicateName:
          'Канал с таким именем уже существует',

        notifications: {
          loadError: 'Ошибка загрузки',
          offline: 'Нет соединения с сервером',
          channelCreated: 'Канал успешно создан',
          channelRenamed: 'Канал успешно переименован',
          channelDeleted: 'Канал успешно удалён',
          operationError: 'Операция не выполнена',
        },
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    supportedLngs: ['ru'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;