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
          <div className="max-w-2xl">
            <input
              type="text"
              placeholder="Cerca una prediction…"
              disabled
              className="w-full px-6 py-2 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed opacity-60"
            />
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
