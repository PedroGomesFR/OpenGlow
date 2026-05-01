import { useTranslation } from 'react-i18next';

function NotFoundPage() {
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t('not_found_title')}</h1>
        </div>
    );
}

export default NotFoundPage;