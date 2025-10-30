import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const baseUrl = 'https://bellanapoli.io'; // senza www
  const title = 'Bella Napoli - Scommetti sul futuro, con stile degen italiano';
  const url = `${baseUrl}/bellanapoli.prediction/${params.slug}`;
  const image = `${baseUrl}/media/image/BellaNapoli1200%20x%20630.png`;

  return {
    title,
    description: baseUrl,
    openGraph: {
      title,
      description: baseUrl,
      url,
      type: 'article',
      siteName: 'Bella Napoli',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: 'Bella Napoli',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: baseUrl,
      images: [image],
    },
  };
}

export default function PredictionLayout({ children }: { children: React.ReactNode }) {
  return children;
}


