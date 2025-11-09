"use client";
import { useState, useEffect, useRef } from 'react';
import PredictionCard from './PredictionCard';

interface LazyPredictionCardProps {
  id: string;
  title: string;
  closingDate: string;
  yesPercentage: number;
  noPercentage: number;
  category: string;
  status?: string;
  totalBets?: number;
  imageUrl?: string;
  poolAddress?: string;
  totalPredictions?: number;
}

export default function LazyPredictionCard(props: LazyPredictionCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Una volta visibile, non serve più osservare
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Carica quando la card è a 100px dallo viewport (per anticipare lo scroll)
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className="md:aspect-square">
      {isVisible ? (
        <PredictionCard {...props} />
      ) : (
        // Placeholder mentre non è visibile (stessa altezza per evitare layout shift)
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse md:aspect-square" />
      )}
    </div>
  );
}

