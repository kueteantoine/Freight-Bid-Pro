import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTranslationsForLocale } from './fetch-translations';

export const locales = ['en', 'fr'];
export const defaultLocale = 'fr';

// A simple deep merge utility function
function deepMerge(target: any, source: any) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export default getRequestConfig(async ({ requestLocale }: { requestLocale: Promise<string | undefined> }) => {
    // Extract locale from requestLocale promise provided by next-intl v3.22+
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !locales.includes(locale as any)) {
        locale = defaultLocale;
    }

    // Load the static messages from the file system
    let staticMessages = {};
    try {
        staticMessages = (await import(`../messages/${locale}.json`)).default;
    } catch (error) {
        console.warn(`Could not load static messages for locale: ${locale}`, error);
    }

    // Fetch all translations for this locale from the database
    const dbMessages = await getTranslationsForLocale(locale);

    // Deep merge the static messages and the DB messages.
    // We apply the DB messages on top so they overwrite static keys.
    const messages = deepMerge(staticMessages, dbMessages);

    return {
        locale,
        messages,
        onError(error) {
            // Silently ignore missing translation errors in production
            if (process.env.NODE_ENV === 'development') {
                console.warn('[i18n]', error.message);
            }
        },
        getMessageFallback({ namespace, key }) {
            // Instead of showing "navigation.key_name", show "Key Name"
            const fallback = key
                .replace(/_+/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
            return fallback;
        }
    };
});
