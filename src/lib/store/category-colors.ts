import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCategoryColors } from '@/lib/category-colors';

interface CategoryColorsState {
  colorMap: Record<string, string>;
  setCategoryColor: (category: string, color: string) => void;
  generateColors: (categories: string[]) => void;
  resetColors: () => void;
}

export const useCategoryColors = create<CategoryColorsState>()(
  persist(
    (set) => ({
      colorMap: {},
      
      setCategoryColor: (category, color) => 
        set((state) => ({
          colorMap: {
            ...state.colorMap,
            [category]: color
          }
        })),
      
      generateColors: (categories) => {
        const colors = generateCategoryColors(categories);
        const newColorMap: Record<string, string> = {};
        
        categories.forEach((category, index) => {
          newColorMap[category] = colors[index];
        });
        
        set((state) => ({
          colorMap: {
            ...state.colorMap,
            ...newColorMap
          }
        }));
      },
      
      resetColors: () => {
        set({ colorMap: {} });
      }
    }),
    {
      name: 'budget-flowr-category-colors'
    }
  )
);

// Helper function to get color for a category, with fallback to auto-generated color
export function getCategoryColor(
  category: string, 
  colorMap: Record<string, string>,
  index: number = 0
): string {
  // If there's a custom color defined for this category, use it
  if (colorMap[category]) {
    return colorMap[category];
  }
  
  // Otherwise generate a color based on the default palette
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#4682b4',
    '#8b008b', '#b8860b', '#008080', '#800000', '#2e8b57',
    '#ff69b4', '#8b4513', '#483d8b', '#808000', '#4b0082'
  ];
  
  return colorPalette[index % colorPalette.length];
}