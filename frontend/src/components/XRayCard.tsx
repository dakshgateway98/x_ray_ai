import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { XRay } from '@/services/xrayService';
import FormattedText from './FormattedText';
import DiagnosisDisplay from './DiagnosisDisplay';
import ClinicalNotes from './ClinicalNotes';
import ConfirmationDialog from './ConfirmationDialog';

const BACKEND_URL = 'http://localhost:8000';

interface DiagnosisResult {
  primary_diagnosis?: string;
  confidence_level?: string;
  differential_diagnoses?: string[];
  key_findings?: string[];
  recommendations?: string[];
}

interface XRayCardProps {
  xray: XRay;
  onRediagnose: (id: number) => void;
  onDelete?: (id: number) => void;
  rediagnosing: number | null;
  deleting?: number | null;
}

const XRayCard: React.FC<XRayCardProps> = ({ 
  xray, 
  onRediagnose, 
  onDelete,
  rediagnosing, 
  deleting 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const parseDiagnosis = (diagnosisString: string): DiagnosisResult | null => {
    try {
      return JSON.parse(diagnosisString);
    } catch (e) {
      console.error("Failed to parse diagnosis:", e);
      return null;
    }
  };

  const renderDiagnosis = () => {
    if (!xray.final_diagnosis) return null;

    const diagnosis = parseDiagnosis(xray.final_diagnosis);
    if (!diagnosis) {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Diagnosis:</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            <FormattedText text={xray.final_diagnosis} />
          </p>
        </div>
      );
    }

    return <DiagnosisDisplay diagnosis={diagnosis} compact={true} />;
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(xray.id);
    }
  };

  // Ensure imageUrl is absolute
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}${url}`;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">X-Ray #{xray.id}</h3>
          <p className="text-sm text-gray-600">
            Uploaded: {new Date(xray.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        
        {/* Image */}
        <div className="mb-4">
          {xray.image_url ? (
            <img 
              src={getFullImageUrl(xray.image_url)} 
              alt={`X-Ray ${xray.id}`} 
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-gray-600">Image not available</p>
            </div>
          )}
        </div>
        
        {/* Status */}
        <div className="mb-4">
          <p className="text-sm font-medium">
            Status: 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              xray.diagnosis_status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : xray.diagnosis_status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {xray.diagnosis_status}
            </span>
          </p>
        </div>
        
        {/* Clinical Notes */}
        <ClinicalNotes notes={xray.clinical_notes} className="mb-4" />
        
        {/* Diagnosis Result */}
        {xray.diagnosis_status === 'completed' && xray.final_diagnosis && (
          renderDiagnosis()
        )}
        
        {/* Error Message */}
        {xray.diagnosis_status === 'failed' && xray.processing_error && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2 text-red-600">Error:</h4>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {xray.processing_error}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            to={`/xray/${xray.id}`}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded text-center hover:bg-blue-600 transition-colors"
          >
            View Details
          </Link>
          
          {(xray.diagnosis_status === 'failed' || xray.diagnosis_status === 'completed') && (
            <button
              onClick={() => onRediagnose(xray.id)}
              disabled={rediagnosing === xray.id}
              className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {rediagnosing === xray.id ? 'Re-diagnosing...' : 'Re-diagnose'}
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting === xray.id}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting === xray.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete X-Ray"
        message={`Are you sure you want to delete X-Ray #${xray.id}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default XRayCard; 