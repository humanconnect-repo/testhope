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
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
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
  );
}
