import React, { useState, useEffect } from 'react';
import { FieldMapping } from '@/lib/import/field-mapping-types';
import { detectMapping, getSavedMappings, saveMapping, updateMapping } from '@/lib/import/field-mapping-service';

interface FieldMappingUIProps {
  headers: string[];
  onMappingChange: (mapping: FieldMapping) => void;
  initialMapping?: FieldMapping;
}

export const FieldMappingUI: React.FC<FieldMappingUIProps> = ({
  headers,
  onMappingChange,
  initialMapping
}) => {
  // Use initialMapping only during initial render, not on every update
  const [mapping, setMapping] = useState<FieldMapping>(() =>
    initialMapping || detectMapping(headers)
  );
  const [savedMappings, setSavedMappings] = useState<FieldMapping[]>([]);
  const [configName, setConfigName] = useState('');
  const [sourceIdentifier, setSourceIdentifier] = useState('');
  const [loadedMappingId, setLoadedMappingId] = useState<string | undefined>(initialMapping?.id);
  const [mappingModified, setMappingModified] = useState(false);

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

    const mappingToSave: FieldMapping = {
      ...mapping,
      name: configName,
      sourceIdentifier
    };

    await saveMapping(mappingToSave);
    setConfigName('');
    const mappings = await getSavedMappings();
    setSavedMappings(mappings);
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
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Map CSV Fields to Transaction Properties</h2>

      {savedMappings.length > 0 && (
        <div className="border p-4 rounded-md">
          <h3 className="font-medium mb-2">Load Saved Mapping</h3>
          <div className="grid grid-cols-1 gap-2">
            {savedMappings.map(saved => (
              <button
                key={saved.id}
                onClick={() => handleLoadMapping(saved)}
                className="text-left px-3 py-2 border rounded hover:bg-gray-50"
              >
                {saved.name} {saved.sourceIdentifier ? `(${saved.sourceIdentifier})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border p-4 rounded-md">
        <h3 className="font-medium mb-4">Field Mappings</h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">Required Fields</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <select
                  value={mapping.mappings.date || ''}
                  onChange={e => handleMappingChange('date', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select a column</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <select
                  value={mapping.mappings.description || ''}
                  onChange={e => handleMappingChange('description', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select a column</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <select
                  value={mapping.mappings.amount || ''}
                  onChange={e => handleMappingChange('amount', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select a column</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Optional Fields</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={mapping.mappings.type || ''}
                  onChange={e => handleMappingChange('type', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={mapping.mappings.categoryId || ''}
                  onChange={e => handleMappingChange('categoryId', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={mapping.mappings.status || ''}
                  onChange={e => handleMappingChange('status', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select
                  value={mapping.mappings.accountId || ''}
                  onChange={e => handleMappingChange('accountId', e.target.value || null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded-md">
        <h3 className="font-medium mb-4">Import Options</h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Format</label>
            <select
              value={mapping.options.dateFormat}
              onChange={e => handleOptionChange('dateFormat', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="negativeAmountIsExpense"
              checked={mapping.options.negativeAmountIsExpense}
              onChange={e => handleOptionChange('negativeAmountIsExpense', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="negativeAmountIsExpense">
              Negative amounts are expenses
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="invertAmount"
              checked={mapping.options.invertAmount}
              onChange={e => handleOptionChange('invertAmount', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="invertAmount">
              Invert amount sign (for banks that show expenses as positive)
            </label>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded-md">
        <h3 className="font-medium mb-4">Save Configuration</h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Configuration Name</label>
            <input
              type="text"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="E.g., Chase Bank Import"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Source Identifier (Optional)</label>
            <input
              type="text"
              value={sourceIdentifier}
              onChange={e => setSourceIdentifier(e.target.value)}
              placeholder="E.g., Chase Bank"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex space-x-4">
            {loadedMappingId ? (
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdateMapping}
                  disabled={!mappingModified}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Update Saved Configuration
                </button>
                <button
                  onClick={() => {
                    setLoadedMappingId(undefined);
                    setMappingModified(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveMapping}
                disabled={!configName}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Save As New Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
