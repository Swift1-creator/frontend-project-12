import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <main>
      <h1>{t('notFound.title')}</h1>

      <Link to="/">
        {t('notFound.backHome')}
      </Link>
    </main>
  );
};

export default NotFoundPage;