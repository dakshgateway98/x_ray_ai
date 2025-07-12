import React, { useState } from 'react';

interface ClinicalNotesProps {
  notes?: string;
  onSave?: (notes: string) => void;
  editable?: boolean;
  className?: string;
}

const ClinicalNotes: React.FC<ClinicalNotesProps> = ({ 
  notes, 
  onSave, 
  editable = false,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');

  const handleSave = () => {
    if (onSave) {
      onSave(editedNotes);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(notes || '');
    setIsEditing(false);
  };

  if (!editable) {
    return (
      <div className={`${className}`}>
        <h4 className="font-medium text-sm mb-2">Clinical Notes:</h4>
        {notes ? (
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            <div className="whitespace-pre-wrap">{notes}</div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No clinical notes available</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">Clinical Notes:</h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-700 text-xs"
          >
            Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
            rows={4}
            placeholder="Enter clinical notes..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
          <div className="whitespace-pre-wrap">{notes || 'No clinical notes available'}</div>
        </div>
      )}
    </div>
  );
};

export default ClinicalNotes; 