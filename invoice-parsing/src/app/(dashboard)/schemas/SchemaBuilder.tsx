import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface SchemaBuilderProps {
  onSave: (schema: any) => void;
}

const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ onSave }) => {
  const [schemaName, setSchemaName] = useState('');
  const [fields, setFields] = useState<any[]>([]);

  const addField = () => {
    setFields([...fields, {
      name: '',
      description: '',
      type: 'string',
      required: false,
      validation: ''
    }]);
  };

  const updateField = (index: number, field: any) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveSchema = () => {
    if (!schemaName || fields.length === 0) return;
    
    const schema = {
      name: schemaName,
      fields: fields.filter(f => f.name.trim() !== '')
    };
    
    onSave(schema);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Define Schema</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schema Name
        </label>
        <input
          type="text"
          value={schemaName}
          onChange={(e) => setSchemaName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., Invoice Schema"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Fields</h3>
          <button
            onClick={addField}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Field
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., invoice_number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="currency">Currency</option>
                    <option value="array">Array</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={field.description}
                  onChange={(e) => updateField(index, { ...field, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Invoice number from the document"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <button
                  onClick={() => removeField(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={saveSchema}
        disabled={!schemaName || fields.length === 0}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Save Schema
      </button>
    </div>
  );
};

export default SchemaBuilder;