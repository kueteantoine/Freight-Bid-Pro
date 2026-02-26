import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type TranslationMap = Record<string, string>;
export type NamespaceMap = Record<string, TranslationMap>;

/**
 * Fetches translations from the database for a specific locale.
 * Uses aggressive caching via Next.js unstable_cache to minimize database queries.
 * Cache is tagged with 'translations' to allow for easy invalidation when admins update the text.
 */
export const getTranslationsForLocale = unstable_cache(
    async (locale: string): Promise<NamespaceMap> => {
        try {
            const supabase = await createClient();

            const { data, error } = await supabase
                .from('translations')
                .select('key, namespace, en_value, fr_value');

            if (error) {
                console.error('Error fetching translations from database:', error);
                return {};
            }

            if (!data || data.length === 0) {
                return {};
            }

            // Format the flat database rows into a nested object: { namespace: { key: value } }
            const formattedTranslations: NamespaceMap = {};

            data.forEach((row) => {
                const { key, namespace, en_value, fr_value } = row;

                // Use the appropriate value based on the requested locale, fallback to English
                const value = locale === 'fr' ? fr_value : en_value;

                if (!formattedTranslations[namespace]) {
                    formattedTranslations[namespace] = {};
                }

                formattedTranslations[namespace][key] = value;
            });

            return formattedTranslations;
        } catch (error) {
            console.error('Unexpected error fetching translations:', error);
            return {};
        }
    },
    ['translations-cache'], // Cache key prefix
    {
        tags: ['translations'], // Tag for revalidation
        revalidate: 3600, // Revalidate every hour as a fallback
    }
);
