"use client";
import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ 
  src, 
  alt = "Avatar", 
  className = "", 
  fallbackText,
  size = 'md'
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-3xl'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Se c'è un errore o non c'è src, mostra l'immagine stock
  if (imageError || !src) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600`}>
        <img 
          src="/media/image/pizzacolorsmall.png" 
          alt="Avatar Stock" 
          className="w-full h-full object-cover"
          onError={() => {
            console.log('Errore caricamento immagine stock PNG');
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
}
