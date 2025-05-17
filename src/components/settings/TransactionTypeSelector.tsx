import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Command imports are temporarily not used in this implementation but kept for future reference
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionTypeClassification } from '@/lib/store/visualization-settings';
import { db } from '@/lib/db';

interface TransactionTypeItem {
  value: string;
  label: string;
}

interface TransactionTypeSelectorProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  classification: TransactionTypeClassification;
}

export function TransactionTypeSelector({
  selectedTypes,
  onChange,
  classification,
}: TransactionTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [availableTypes, setAvailableTypes] = useState<TransactionTypeItem[]>([]);
  const [newType, setNewType] = useState('');

  // Load transaction types from database
  useEffect(() => {
    const loadTransactionTypes = async () => {
      try {
        const transactions = await db.transactions.toArray();
        
        // Extract unique types
        const uniqueTypes = new Set<string>();
        transactions.forEach(transaction => {
          if (transaction.type) {
            uniqueTypes.add(transaction.type);
          }
        });
        
        // Convert to TransactionTypeItem format
        const typeItems = Array.from(uniqueTypes).map(type => ({
          value: type,
          label: type,
        }));
        
        setAvailableTypes(typeItems);
      } catch (error) {
        console.error('Error loading transaction types:', error);
      }
    };
    
    loadTransactionTypes();
  }, []);

  // Don't filter out selected types - just show all types
  const filteredTypes = availableTypes;

  const handleRemove = (type: string) => {
    onChange(selectedTypes.filter(t => t !== type));
  };

  const handleSelect = (value: string) => {
    console.log("Selected:", value);
    
    // Only add if not already selected
    if (!selectedTypes.includes(value)) {
      onChange([...selectedTypes, value]);
    }
    
    // Always close dialog and reset search
    setOpen(false);
    setSearchValue('');
  };

  const handleAddNewType = () => {
    if (!newType || selectedTypes.includes(newType)) return;
    
    // Add to available types if it doesn't exist
    if (!availableTypes.some(type => type.value === newType)) {
      setAvailableTypes([...availableTypes, { value: newType, label: newType }]);
    }
    
    // Add to selected types
    onChange([...selectedTypes, newType]);
    setNewType('');
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTypes.map(type => (
          <Badge key={type} variant="secondary" className="flex items-center gap-1">
            {type}
            <button 
              type="button" 
              onClick={() => handleRemove(type)}
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {type}</span>
            </button>
          </Badge>
        ))}
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add {classification} type
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Add transaction type as {classification}</DialogTitle>
            <DialogDescription>
              Select an existing transaction type or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="px-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for transaction type..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full px-2 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="max-h-[300px] overflow-y-auto mt-2">
                {filteredTypes.length === 0 && searchValue && (
                  <div className="p-2 text-center">
                    <p className="text-sm">No transaction type found.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setNewType(searchValue);
                        handleAddNewType();
                      }}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </Button>
                  </div>
                )}
                
                {filteredTypes.length === 0 && !searchValue && (
                  <div className="p-2 text-center">
                    <p className="text-sm">Start typing to search...</p>
                  </div>
                )}
                
                <div className="flex flex-col">
                  {filteredTypes
                    .filter(type => type.label.toLowerCase().includes(searchValue.toLowerCase()))
                    .map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleSelect(type.value)}
                        className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                      >
                        {type.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}