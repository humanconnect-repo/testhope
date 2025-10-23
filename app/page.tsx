"use client";
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PredictionList from '@/components/PredictionList';
import CategoryTabs from '@/components/CategoryTabs';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Logo e barra di ricerca */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <img 
            src="/media/logos/BellaNapolilogo.png" 
            alt="Bella Napoli" 
            className="h-36 w-auto flex-shrink-0"
          />
          {/* Desktop: barra di ricerca disabilitata */}
          <div className="max-w-2xl hidden sm:block">
            <input
              type="text"
              placeholder="Cerca una prediction…"
              disabled
              className="w-full px-6 py-2 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed opacity-60"
            />
          </div>
          {/* Mobile: icona lente disabilitata */}
          <div className="sm:hidden">
            <div className="w-12 h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center opacity-60">
              <svg 
                className="w-6 h-6 text-gray-400 dark:text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Categorie */}
        <div className="mb-8">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onCategoryChange={handleCategoryChange} 
          />
        </div>

        <PredictionList selectedCategory={selectedCategory} />
      </main>

      <Footer />
    </div>
  );
}
