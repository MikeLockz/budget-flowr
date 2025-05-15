import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVisualizationSettings } from '@/lib/store/visualization-settings';
import { TransactionTypeSelector } from './TransactionTypeSelector';
import { BarChart4, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function VisualizationSettings() {
  const { 
    typeClassifications, 
    // defaultIncomeTypes and defaultExpenseTypes are defined but not used in this component
    // defaultIncomeTypes, 
    // defaultExpenseTypes,
    addTypeClassification, 
    removeTypeClassification, 
    resetToDefaults 
  } = useVisualizationSettings();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state for the form
  const [incomeTypes, setIncomeTypes] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize local state from store
  useEffect(() => {
    const currentIncomeTypes = Object.entries(typeClassifications)
      .filter(([_, classification]) => classification === 'income')
      .map(([type]) => type);
      
    const currentExpenseTypes = Object.entries(typeClassifications)
      .filter(([_, classification]) => classification === 'expense')
      .map(([type]) => type);
    
    setIncomeTypes(currentIncomeTypes);
    setExpenseTypes(currentExpenseTypes);
    setHasChanges(false);
  }, [typeClassifications]);
  
  // Handle income types change
  const handleIncomeTypesChange = (types: string[]) => {
    setIncomeTypes(types);
    setHasChanges(true);
  };
  
  // Handle expense types change
  const handleExpenseTypesChange = (types: string[]) => {
    setExpenseTypes(types);
    setHasChanges(true);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    // First, clear all existing classifications
    Object.keys(typeClassifications).forEach(type => {
      removeTypeClassification(type);
    });
    
    // Then add income types
    incomeTypes.forEach(type => {
      addTypeClassification(type, 'income');
    });
    
    // Then add expense types
    expenseTypes.forEach(type => {
      addTypeClassification(type, 'expense');
    });
    
    setHasChanges(false);
    
    // Invalidate the transactions query cache to force a re-fetch
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    
    toast({
      title: "Settings saved",
      description: "Visualization settings have been updated.",
    });
  };
  
  // Handle reset to defaults
  const handleResetToDefaults = () => {
    resetToDefaults();
    
    // Invalidate the transactions query cache to force a re-fetch
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    
    toast({
      title: "Settings reset",
      description: "Visualization settings have been reset to defaults.",
    });
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Dashboard Visualizations</h2>
          <p className="text-sm text-muted-foreground">
            Configure how transaction types are classified in charts and visualizations.
          </p>
        </div>
        <BarChart4 className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <Tabs defaultValue="income" className="mt-6">
        <TabsList>
          <TabsTrigger value="income">Income Types</TabsTrigger>
          <TabsTrigger value="expense">Expense Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="space-y-4 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Income Transaction Types</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select transaction types that should be classified as income in visualizations.
            </p>
            
            <TransactionTypeSelector
              selectedTypes={incomeTypes}
              onChange={handleIncomeTypesChange}
              classification="income"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="expense" className="space-y-4 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Expense Transaction Types</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select transaction types that should be classified as expenses in visualizations.
            </p>
            
            <TransactionTypeSelector
              selectedTypes={expenseTypes}
              onChange={handleExpenseTypesChange}
              classification="expense"
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button
          disabled={!hasChanges}
          onClick={handleSaveChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </Card>
  );
}