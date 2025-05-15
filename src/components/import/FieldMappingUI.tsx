import React, { useState, useEffect } from 'react';
import { FieldMapping } from '@/lib/import/field-mapping-types';
import { detectMapping, getSavedMappings, saveMapping, updateMapping } from '@/lib/import/field-mapping-service';
// Commented out as it's not used
// import { previewMappedTransactions } from '@/lib/import/import-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SaveIcon, Loader2 } from 'lucide-react';

interface FieldMappingUIProps {
  headers: string[];
  onMappingChange: (mapping: FieldMapping) => void;
  initialMapping?: FieldMapping | null;
  // Preview generation is commented out for now
  // onPreviewGenerated?: (preview: { mapping: FieldMapping }) => void;
}

export const FieldMappingUI: React.FC<FieldMappingUIProps> = ({
  headers,
  onMappingChange,
  initialMapping
  // onPreviewGenerated
}) => {
  // Use initialMapping only during initial render, not on every update
  const [mapping, setMapping] = useState<FieldMapping>(() =>
    initialMapping || detectMapping(headers)
  );
  const [savedMappings, setSavedMappings] = useState<FieldMapping[]>([]);
  const [configName, setConfigName] = useState(initialMapping?.name || '');
  const [sourceIdentifier, setSourceIdentifier] = useState(initialMapping?.sourceIdentifier || '');
  const [loadedMappingId, setLoadedMappingId] = useState<string | undefined>(initialMapping?.id);
  const [mappingModified, setMappingModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadMappings = async () => {
      const mappings = await getSavedMappings();
      setSavedMappings(mappings);
    };
    loadMappings();
  }, []);

  const handleMappingChange = (field: keyof FieldMapping['mappings'], value: string | null) => {
    const newMapping = {
      ...mapping,
      mappings: {
        ...mapping.mappings,
        [field]: value
      }
    };

    setMapping(newMapping);

    if (loadedMappingId) {
      setMappingModified(true);
    }

    // Notify parent component of the change
    onMappingChange(newMapping);
  };

  const handleOptionChange = (option: keyof FieldMapping['options'], value: boolean | string) => {
    const newMapping = {
      ...mapping,
      options: {
        ...mapping.options,
        [option]: value
      }
    };

    setMapping(newMapping);

    if (loadedMappingId) {
      setMappingModified(true);
    }

    // Notify parent component of the change
    onMappingChange(newMapping);
  };

  const handleSaveMapping = async () => {
    if (!configName) return;
    
    setIsSaving(true);

    try {
      const mappingToSave: FieldMapping = {
        ...mapping,
        name: configName,
        sourceIdentifier
      };

      await saveMapping(mappingToSave);
      setConfigName('');
      const mappings = await getSavedMappings();
      setSavedMappings(mappings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadMapping = (savedMapping: FieldMapping) => {
    setMapping(savedMapping);
    setConfigName(savedMapping.name || '');
    setSourceIdentifier(savedMapping.sourceIdentifier || '');
    setLoadedMappingId(savedMapping.id);
    setMappingModified(false);

    // Notify parent component of the loaded mapping
    onMappingChange(savedMapping);
  };

  const handleUpdateMapping = async () => {
    if (!loadedMappingId) return;
    
    setIsSaving(true);

    try {
      const mappingToUpdate: FieldMapping = {
        ...mapping,
        id: loadedMappingId,
        name: configName || mapping.name,
        sourceIdentifier: sourceIdentifier || mapping.sourceIdentifier
      };

      await updateMapping(mappingToUpdate);
      const mappings = await getSavedMappings();
      setSavedMappings(mappings);
      setMappingModified(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Commented out as it's not used yet
  /*
  const handleGeneratePreview = () => {
    if (onPreviewGenerated) {
      // We need to pass the CSV data and mapping to generate a preview
      // The parent component will handle this
      onPreviewGenerated({ mapping });
    }
  };
  */

  return (
    <div className="space-y-6">
      {savedMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {savedMappings.map(saved => (
                <Button
                  key={saved.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleLoadMapping(saved)}
                >
                  {saved.name} {saved.sourceIdentifier ? <span className="text-muted-foreground">({saved.sourceIdentifier})</span> : ''}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Required Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date-mapping">Date</Label>
              <Select
                value={mapping.mappings.date || 'none'}
                onValueChange={(value) => handleMappingChange('date', value === 'none' ? null : value)}
              >
                <SelectTrigger id="date-mapping">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a column</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`date-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-mapping">Description</Label>
              <Select
                value={mapping.mappings.description || 'none'}
                onValueChange={(value) => handleMappingChange('description', value === 'none' ? null : value)}
              >
                <SelectTrigger id="description-mapping">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a column</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`desc-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-mapping">Amount</Label>
              <Select
                value={mapping.mappings.amount || 'none'}
                onValueChange={(value) => handleMappingChange('amount', value === 'none' ? null : value)}
              >
                <SelectTrigger id="amount-mapping">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a column</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`amount-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type-mapping">Type</Label>
              <Select
                value={mapping.mappings.type || 'none'}
                onValueChange={(value) => handleMappingChange('type', value === 'none' ? null : value)}
              >
                <SelectTrigger id="type-mapping">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`type-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-mapping">Category</Label>
              <Select
                value={mapping.mappings.categoryId || 'none'}
                onValueChange={(value) => handleMappingChange('categoryId', value === 'none' ? null : value)}
              >
                <SelectTrigger id="category-mapping">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`cat-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-mapping">Status</Label>
              <Select
                value={mapping.mappings.status || 'none'}
                onValueChange={(value) => handleMappingChange('status', value === 'none' ? null : value)}
              >
                <SelectTrigger id="status-mapping">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`status-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-mapping">Account</Label>
              <Select
                value={mapping.mappings.accountId || 'none'}
                onValueChange={(value) => handleMappingChange('accountId', value === 'none' ? null : value)}
              >
                <SelectTrigger id="account-mapping">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`account-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={mapping.options.dateFormat}
                onValueChange={(value) => handleOptionChange('dateFormat', value)}
              >
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="negative-expense" 
                checked={mapping.options.negativeAmountIsExpense}
                onCheckedChange={(checked) => handleOptionChange('negativeAmountIsExpense', !!checked)}
              />
              <Label htmlFor="negative-expense">Negative amounts are expenses</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="invert-amount" 
                checked={mapping.options.invertAmount}
                onCheckedChange={(checked) => handleOptionChange('invertAmount', !!checked)}
              />
              <Label htmlFor="invert-amount">Invert amount sign (for banks that show expenses as positive)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Save Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="E.g., Chase Bank Import"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-id">Source Identifier (Optional)</Label>
              <Input
                id="source-id"
                value={sourceIdentifier}
                onChange={(e) => setSourceIdentifier(e.target.value)}
                placeholder="E.g., Chase Bank"
              />
            </div>

            <div className="flex justify-end">
                {loadedMappingId ? (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleUpdateMapping}
                      disabled={!mappingModified || isSaving}
                      className="inline-block w-auto"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Update
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLoadedMappingId(undefined);
                        setMappingModified(false);
                      }}
                      className="inline-block"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="inline-block">
                    <Button
                      onClick={handleSaveMapping}
                      disabled={!configName || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};