import React from 'react';
import type { XRay } from '@/services/xrayService';
import { updateXRay } from '@/services/xrayService';
import FormattedText from './FormattedText';
import DiagnosisDisplay from './DiagnosisDisplay';
import ClinicalNotes from './ClinicalNotes';

interface DiagnosisResult {
  primary_diagnosis?: string;
  confidence_level?: string;
  differential_diagnoses?: string[];
  key_findings?: string[];
  recommendations?: string[];
}

interface DiagnosisInfoProps {
  xray: XRay;
  onRediagnose: () => void;
  rediagnosing: boolean;
  onUpdate?: (updatedXray: XRay) => void;
}

const DiagnosisInfo: React.FC<DiagnosisInfoProps> = ({ 
  xray, 
  onRediagnose, 
  rediagnosing,
  onUpdate 
}) => {
  const parseDiagnosis = (diagnosisString: string): DiagnosisResult | null => {
    try {
      return JSON.parse(diagnosisString);
    } catch (e) {
      console.error("Failed to parse diagnosis:", e);
      return null;
    }
  };

  const handleClinicalNotesSave = async (notes: string) => {
    try {
      const updatedXray = await updateXRay(xray.id, { clinicalNotes: notes });
      if (onUpdate) {
        onUpdate(updatedXray);
      }
    } catch (error) {
      console.error('Failed to update clinical notes:', error);
      alert('Failed to update clinical notes. Please try again.');
    }
  };

  const renderDiagnosis = () => {
    if (!xray?.final_diagnosis) return null;

    const diagnosis = parseDiagnosis(xray.final_diagnosis);
    if (!diagnosis) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Diagnosis</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="whitespace-pre-wrap text-gray-700">
              <FormattedText text={xray.final_diagnosis} />
            </div>
          </div>
        </div>
      );
    }

    return <DiagnosisDisplay diagnosis={diagnosis} />;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Diagnosis Information</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient ID</label>
          <p className="mt-1 text-lg">{xray.patient_id}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
            xray.diagnosis_status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : xray.diagnosis_status === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {xray.diagnosis_status}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Uploaded</label>
          <p className="mt-1">{new Date(xray.uploaded_at).toLocaleString()}</p>
        </div>

        {/* Clinical Notes */}
        <ClinicalNotes 
          notes={xray.clinical_notes} 
          onSave={handleClinicalNotesSave}
          editable={true}
        />

        {xray.diagnosis_status === 'completed' && (
          <>
            {xray.vision_analysis && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Vision Analysis</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    <FormattedText text={xray.vision_analysis} />
                  </div>
                </div>
              </div>
            )}

            {xray.vector_search_results && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Vector Search Results</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    <FormattedText text={xray.vector_search_results} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {xray.diagnosis_status === 'failed' && xray.processing_error && (
          <div>
            <label className="block text-sm font-medium text-red-700">Error</label>
            <div className="mt-1 p-3 bg-red-50 rounded-lg">
              <div className="text-red-700">{xray.processing_error}</div>
            </div>
          </div>
        )}

        {/* Re-diagnosis Button */}
        {(xray.diagnosis_status === 'failed' || xray.diagnosis_status === 'completed') && (
          <div className="pt-4">
            <button
              onClick={onRediagnose}
              disabled={rediagnosing}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {rediagnosing ? 'Re-diagnosing...' : 'Re-diagnose X-Ray'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will reset the diagnosis and run the analysis again.
            </p>
          </div>
        )}
      </div>

      {/* Diagnosis Results Section */}
      {xray.diagnosis_status === 'completed' && renderDiagnosis()}
    </div>
  );
};

export default DiagnosisInfo; 