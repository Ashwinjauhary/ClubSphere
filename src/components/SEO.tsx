import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

export const SEO = ({
    title = 'ClubSphere - College Club Management',
    description = 'ClubSphere is the ultimate college club management platform. Streamline events, memberships, and approvals efficiently.',
    image = '/logo512.png',
    url
}: SEOProps) => {
    const siteUrl = 'https://club-sphere-sepia.vercel.app';
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="ClubSphere" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
};
