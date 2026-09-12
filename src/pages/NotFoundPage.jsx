import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <main>
    <h1>Страница не найдена</h1>

    <Link to="/">
      Вернуться на главную
    </Link>
  </main>
);

export default NotFoundPage;