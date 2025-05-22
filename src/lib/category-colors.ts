// No imports needed here

// Utility function to determine if text should be light or dark based on background color
export function getTextColorForBackground(hexColor: string): string {
  // Remove the hash if it exists
  hexColor = hexColor.replace('#', '');
  
  // Parse the color
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 128 ? '#000000' : '#ffffff';
}

// Generate a consistent color palette for categories
export function generateCategoryColors(categories: string[]): string[] {
  return categories.map((_, index) => {
    // Use a predefined color palette that works well for both charts
    const colorPalette = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#4682b4',
      '#8b008b', '#b8860b', '#008080', '#800000', '#2e8b57',
      '#ff69b4', '#8b4513', '#483d8b', '#808000', '#4b0082'
    ];
    return colorPalette[index % colorPalette.length];
  });
}

// Create a map of category names to colors
export function createCategoryColorMap(
  categories: string[], 
  categoryColors: string[]
): Map<string, string> {
  const colorMap = new Map<string, string>();
  categories.forEach((category, index) => {
    if (index < categoryColors.length) {
      colorMap.set(category, categoryColors[index]);
    }
  });
  return colorMap;
}

// Get color for a category using a static color palette
export function getCategoryColorFromStore(
  _category: string, // Prefix with underscore to indicate it's intentionally unused
  index: number = 0
): string {
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#4682b4',
    '#8b008b', '#b8860b', '#008080', '#800000', '#2e8b57',
    '#ff69b4', '#8b4513', '#483d8b', '#808000', '#4b0082'
  ];
  return colorPalette[index % colorPalette.length];
}