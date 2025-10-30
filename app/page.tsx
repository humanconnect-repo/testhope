"use client";
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PredictionList from '../components/PredictionList';
import CancelledPredictionsList from '../components/CancelledPredictionsList';
import ResolvedPredictionsList from '../components/ResolvedPredictionsList';
import CategoryTabs from '../components/CategoryTabs';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleMobileSearchClick = () => {
    setShowMobileSearch(true);
  };

  const handleMobileSearchClose = () => {
    setShowMobileSearch(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        {/* Logo e barra di ricerca */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <img 
            src="/media/logos/BellaNapolilogo.png" 
            alt="Bella Napoli" 
            className="h-36 w-auto flex-shrink-0"
          />
          {/* Desktop: barra di ricerca attiva */}
          <div className="max-w-2xl hidden sm:block">
            <input
              type="text"
              placeholder="Cerca una prediction…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-6 py-2 text-lg rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
            />
          </div>
          {/* Mobile: icona lente cliccabile */}
          <div className="sm:hidden">
            <button 
              onClick={handleMobileSearchClick}
              className="w-12 h-12 rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 flex items-center justify-center hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors duration-200"
            >
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
            </button>
          </div>
        </div>

        {/* CTA classifica */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/15 dark:hover:bg-primary/30 transition-colors font-medium"
            disabled
          >
            Uè guagliò, vedi 'sta classifica!
          </button>
        </div>

        {/* Categorie */}
        <div className="mb-8">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onCategoryChange={handleCategoryChange} 
          />
        </div>

        {/* Modal ricerca mobile */}
        {showMobileSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="text"
                  placeholder="Cerca una prediction…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 px-4 py-2 text-base rounded-lg border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleMobileSearchClose}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cercando: "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        )}

        <PredictionList selectedCategory={selectedCategory} searchQuery={searchQuery} />
        
        {/* Prediction Risolte */}
        <ResolvedPredictionsList />

        {/* Pools Cancellate */}
        <div className="mt-12">
          <CancelledPredictionsList />
        </div>
      </main>

      <Footer />
    </div>
  );
}
