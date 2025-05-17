import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Save } from 'lucide-react';
import { useCategories } from '@/hooks/use-transactions';
import { useCategoryColors, getCategoryColor } from '@/lib/store/category-colors';
import { getTextColorForBackground } from '@/lib/category-colors';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function CategoryColorPicker() {
  const { data: categories = [] } = useCategories();
  const { colorMap, setCategoryColor, generateColors, resetColors } = useCategoryColors();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state for colors
  const [localColorMap, setLocalColorMap] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize with stored colors or generate new ones if needed
  useEffect(() => {
    const categoryNames = categories.map(cat => cat.name);
    
    // If we have new categories without colors, generate colors for them
    const needsColors = categoryNames.some(cat => !colorMap[cat]);
    if (needsColors) {
      generateColors(categoryNames);
    }
    
    setLocalColorMap({...colorMap});
    setHasChanges(false);
  }, [categories, colorMap, generateColors]);
  
  // Update local color
  const handleColorChange = (category: string, color: string) => {
    setLocalColorMap(prev => ({
      ...prev,
      [category]: color
    }));
    setHasChanges(true);
  };
  
  // Save all color changes
  const handleSaveChanges = () => {
    // Update all colors in the store
    Object.entries(localColorMap).forEach(([category, color]) => {
      setCategoryColor(category, color);
    });
    
    setHasChanges(false);
    
    // Invalidate queries to refresh data with new colors
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    
    toast({
      title: "Colors saved",
      description: "Category colors have been updated.",
    });
  };
  
  // Reset colors to defaults
  const handleResetToDefaults = () => {
    resetColors();
    
    // Generate new colors for all categories
    const categoryNames = categories.map(cat => cat.name);
    generateColors(categoryNames);
    
    // Invalidate queries to refresh data with new colors
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    
    toast({
      title: "Colors reset",
      description: "Category colors have been reset to defaults.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Category Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the colors used for each category in charts and visualizations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, index) => {
          const categoryName = category.name;
          const color = localColorMap[categoryName] || getCategoryColor(categoryName, colorMap, index);
          const textColor = getTextColorForBackground(color);
          
          return (
            <div 
              key={category.id} 
              className="flex items-center space-x-3 p-2 border rounded-md"
            >
              <Badge 
                style={{ 
                  backgroundColor: color,
                  color: textColor,
                  borderColor: 'transparent',
                  minWidth: '100px',
                  justifyContent: 'center'
                }}
              >
                {categoryName}
              </Badge>
              
              <Input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(categoryName, e.target.value)}
                className="w-16 h-8 p-1 cursor-pointer"
              />
              
              <Input 
                type="text"
                value={color}
                onChange={(e) => handleColorChange(categoryName, e.target.value)}
                className="w-28 h-8"
                placeholder="#000000"
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Colors
        </Button>
        <Button
          disabled={!hasChanges}
          onClick={handleSaveChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}