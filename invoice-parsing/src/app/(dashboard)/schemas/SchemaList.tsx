import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface SchemaListProps {
  schemas: any[];
  onEdit?: (schema: any) => void;
  onDelete?: (schemaId: string) => void;
}

const SchemaList: React.FC<SchemaListProps> = ({ schemas, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {schemas.map((schema) => (
        <div key={schema.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{schema.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{schema.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {schema.fields?.length || 0} fields
              </p>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(schema)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(schema.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SchemaList;