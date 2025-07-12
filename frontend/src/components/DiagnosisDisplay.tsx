import React from 'react';
import FormattedText from './FormattedText';

interface DiagnosisResult {
  primary_diagnosis?: string;
  confidence_level?: string;
  differential_diagnoses?: string[];
  key_findings?: string[];
  recommendations?: string[];
}

interface DiagnosisDisplayProps {
  diagnosis: DiagnosisResult;
  compact?: boolean;
}

const DiagnosisDisplay: React.FC<DiagnosisDisplayProps> = ({ diagnosis, compact = false }) => {
  const containerClass = compact ? "mb-4 space-y-3" : "mb-6 space-y-4";
  const titleClass = compact ? "font-medium text-sm mb-1" : "font-medium text-gray-700 mb-2";
  const textClass = compact ? "text-sm text-gray-700" : "text-gray-700 text-sm leading-relaxed";

  return (
    <div className={containerClass}>
      {!compact && <h3 className="text-lg font-semibold mb-3">Diagnosis Results</h3>}
      
      {diagnosis.primary_diagnosis && (
        <div>
          <h4 className={titleClass}>Primary Diagnosis:</h4>
          <p className={`${textClass} bg-blue-50 p-2 rounded`}>
            <FormattedText text={diagnosis.primary_diagnosis} />
          </p>
        </div>
      )}

      {diagnosis.confidence_level && (
        <div>
          <h4 className={titleClass}>Confidence Level:</h4>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            diagnosis.confidence_level === 'high' 
              ? 'bg-green-100 text-green-800'
              : diagnosis.confidence_level === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {diagnosis.confidence_level}
          </span>
        </div>
      )}

      {diagnosis.key_findings && diagnosis.key_findings.length > 0 && (
        <div>
          <h4 className={titleClass}>Key Findings:</h4>
          <div className="space-y-2">
            {diagnosis.key_findings.map((finding, index) => (
              <div key={index} className={`${textClass} bg-gray-50 p-3 rounded`}>
                <div className="whitespace-pre-wrap">
                  <FormattedText text={finding} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnosis.differential_diagnoses && diagnosis.differential_diagnoses.length > 0 && (
        <div>
          <h4 className={titleClass}>Differential Diagnoses:</h4>
          <ul className={`${textClass} bg-gray-50 p-2 rounded`}>
            {diagnosis.differential_diagnoses.map((dx, index) => (
              <li key={index} className="ml-4 list-disc">
                <FormattedText text={dx} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
        <div>
          <h4 className={titleClass}>Recommendations:</h4>
          <ul className={`${textClass} bg-gray-50 p-2 rounded`}>
            {diagnosis.recommendations.map((rec, index) => (
              <li key={index} className="ml-4 list-disc">
                <FormattedText text={rec} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiagnosisDisplay; 