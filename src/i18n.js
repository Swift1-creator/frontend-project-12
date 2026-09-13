import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      app: { title: 'Hexlet Chat', logout: 'Выйти' },
      auth: {
        loginTitle: 'Войти', signupTitle: 'Регистрация', username: 'Ваш ник',
        password: 'Пароль', login: 'Войти', signup: 'Зарегистрироваться',
        noAccount: 'Нет аккаунта?', haveAccount: 'Уже есть аккаунт?',
        toSignup: 'Регистрация', toLogin: 'Войти', required: 'Обязательное поле',
        loginError: 'Неверные имя пользователя или пароль',
        signupError: 'Не удалось зарегистрироваться',
        duplicateUser: 'Такой пользователь уже существует',
        usernameLength: 'От 3 до 20 символов', passwordLength: 'Не менее 6 символов',
        passwordMismatch: 'Пароли должны совпадать',
      },
      chat: {
        channels: 'Каналы', messages: 'Сообщения', addChannel: 'Добавить',
        channelName: 'Имя канала', channelPlaceholder: 'Например, frontend',
        newChannelName: 'Новое название', newMessage: 'Новое сообщение',
        manageChannel: 'Управление каналом', createChannel: 'Добавить канал',
        renameChannel: 'Переименовать канал', deleteChannel: 'Удалить канал?',
        rename: 'Переименовать', delete: 'Удалить', save: 'Сохранить',
        cancel: 'Отмена', send: 'Отправить', messagePlaceholder: 'Введите сообщение',
        connectionEstablished: 'Соединение установлено', noConnection: 'Нет соединения',
        defaultUser: 'Пользователь',
        deleteConfirmation: 'Канал «{{name}}» и его сообщения будут удалены.',
        createError: 'Не удалось создать канал', renameError: 'Не удалось переименовать канал',
        deleteError: 'Не удалось удалить канал', sendError: 'Не удалось отправить сообщение',
        loadError: 'Не удалось загрузить данные чата',
        nameLength: 'Название должно содержать от 3 до 20 символов',
        duplicateName: 'Канал с таким именем уже существует',
        notifications: {
          success: 'Успешно', loadError: 'Ошибка загрузки', offline: 'Нет соединения с сервером',
          channelCreated: 'Канал создан', channelRenamed: 'Канал переименован',
          channelDeleted: 'Канал удалён', operationError: 'Операция не выполнена',
        },
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources, lng: 'ru', fallbackLng: 'ru', supportedLngs: ['ru'],
  interpolation: { escapeValue: false },
});

export default i18n;
```

## App.jsx
```jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './components/SignupPage.jsx';
import Header from './components/Header.jsx';
import { getToken } from './auth.js';

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <>
    <Header />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;