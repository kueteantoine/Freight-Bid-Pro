import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://freightbidpro.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/dashboard', '/api', '/*/(admin)/*', '/*/(dashboard)/*'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
