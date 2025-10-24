"use client";

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { name: "Novità", value: "all" },
  { name: "Trending", value: "trending" },
  { name: "Crypto", value: "Crypto" },
  { name: "Politica", value: "Politica" },
  { name: "Degen", value: "Degen" },
  { name: "Sport", value: "Sport" },
  { name: "TV", value: "TV" },
];

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-4 sm:flex sm:space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg gap-1">
        {/* Prima riga: Novità, Trending, Crypto, Politica */}
        <div className="col-span-4 sm:hidden grid grid-cols-4 gap-1">
          {categories.slice(0, 4).map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedCategory === category.value
                  ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Seconda riga centrata: Degen, Sport, TV */}
        <div className="col-span-4 sm:hidden flex justify-center gap-1 mt-1">
          {categories.slice(4).map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedCategory === category.value
                  ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Desktop: layout orizzontale */}
        <div className="hidden sm:contents">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.value
                  ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
