import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile' | 'event';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: Record<string, any>;
    keywords?: string[];
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

export const SEO = ({
    title = 'ClubSphere - College Club Management',
    description = 'ClubSphere is the ultimate college club management platform. Streamline events, memberships, and approvals efficiently.',
    image = '/logo512.png',
    url,
    type = 'website',
    schema,
    keywords = [],
    author = 'ClubSphere Team',
    publishedTime,
    modifiedTime
}: SEOProps) => {
    const siteUrl = 'https://clubsphere.in';
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    // Default Keywords
    const defaultKeywords = [
        'ClubSphere', 'college club management', 'student organizations',
        'event scanner', 'university clubs', 'campus events', 'student leadership'
    ];
    const allKeywords = [...new Set([...defaultKeywords, ...keywords])].join(', ');

    return (
        <Helmet>
            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={allKeywords} />
            <meta name="author" content={author} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="ClubSphere" />
            <meta property="og:locale" content="en_US" />

            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@clubsphere" />
            <meta name="twitter:creator" content="@clubsphere" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}

            {/* Default Schema for WebSite */}
            {!schema && type === 'website' && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "ClubSphere",
                        "alternateName": ["Club Sphere", "CS"],
                        "url": siteUrl,
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": `${siteUrl}/search?q={search_term_string}`
                            },
                            "query-input": "required name=search_term_string"
                        }
                    })}
                </script>
            )}
        </Helmet>
    );
};
