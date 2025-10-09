import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const SchemaBuilder = ({ onSave }) => {
  const [fields, setFields] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'string',
    validation: '',
    required: false
  });

  const fieldTypes = ['string', 'number', 'date', 'email', 'currency', 'array'];

  const addField = () => {
    if (!formData.name || !formData.description) return;
    
    if (editingField !== null) {
      const updated = [...fields];
      updated[editingField] = { ...formData, id: Date.now() };
      setFields(updated);
      setEditingField(null);
    } else {
      setFields([...fields, { ...formData, id: Date.now() }]);
    }
    
    setFormData({ name: '', description: '', type: 'string', validation: '', required: false });
    setShowForm(false);
  };

  const editField = (idx) => {
    setFormData(fields[idx]);
    setEditingField(idx);
    setShowForm(true);
  };

  const deleteField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const saveSchema = () => {
    if (fields.length === 0) {
      alert('Please add at least one field to the schema');
      return;
    }
    onSave({ fields, createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Schema Configuration</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Field
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingField !== null ? 'Edit Field' : 'New Field'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., invoice_number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {fieldTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this field represents and expected format"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation JavaScript (Optional)
              </label>
              <textarea
                value={formData.validation}
                onChange={(e) => setFormData({ ...formData, validation: e.target.value })}
                placeholder="e.g., value.length > 0 && value.match(/^INV-\d+$/)"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Required Field</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addField}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {editingField !== null ? 'Update' : 'Add'} Field
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingField(null);
                setFormData({ name: '', description: '', type: 'string', validation: '', required: false });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <SchemaList 
        fields={fields} 
        onEdit={editField} 
        onDelete={deleteField} 
      />

      {fields.length > 0 && (
        <button
          onClick={saveSchema}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
        >
          Save Schema & Continue
        </button>
      )}
    </div>
  );
};