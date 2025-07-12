import React, { useState } from 'react';
import type { XRayFinding } from '@/services/xrayService';

const BACKEND_URL = 'http://localhost:8000';

interface XRayImageProps {
  imageUrl: string;
  title: string;
  findings?: XRayFinding[];
}

const XRayImage: React.FC<XRayImageProps> = ({ imageUrl, title, findings = [] }) => {
  const [hoveredFinding, setHoveredFinding] = useState<XRayFinding | null>(null);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'border-red-500 bg-red-500/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/20';
      case 'low':
        return 'border-blue-500 bg-blue-500/20';
      default:
        return 'border-gray-500 bg-gray-500/20';
    }
  };

  // Ensure imageUrl is absolute
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}${url}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      
      <div className="relative inline-block">
        <img
          src={getFullImageUrl(imageUrl)}
          alt={title}
          className="max-w-full h-auto rounded-lg shadow-md"
          style={{ maxHeight: '600px' }}
        />
        
        {/* Findings Overlays */}
        {findings.map((finding) => (
          <div
            key={finding.id}
            className={`absolute border-2 ${getConfidenceColor(finding.confidence)} cursor-pointer transition-all duration-200 hover:opacity-80`}
            style={{
              left: `${finding.x1}%`,
              top: `${finding.y1}%`,
              width: `${finding.x2 - finding.x1}%`,
              height: `${finding.y2 - finding.y1}%`,
            }}
            onMouseEnter={() => setHoveredFinding(finding)}
            onMouseLeave={() => setHoveredFinding(null)}
          />
        ))}
        
        {/* Tooltip */}
        {hoveredFinding && (
          <div
            className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs"
            style={{
              left: `${hoveredFinding.x2 + 2}%`,
              top: `${hoveredFinding.y1}%`,
            }}
          >
            <div className="font-semibold mb-1">Finding</div>
            <div className="text-gray-200">{hoveredFinding.diagnosis}</div>
            <div className="text-xs text-gray-400 mt-1">
              Confidence: {hoveredFinding.confidence}
            </div>
          </div>
        )}
      </div>
      
      {/* Findings Summary */}
      {findings.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-900 mb-2">Detected Findings</h4>
          <div className="space-y-2">
            {findings.map((finding) => (
              <div
                key={finding.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onMouseEnter={() => setHoveredFinding(finding)}
                onMouseLeave={() => setHoveredFinding(null)}
              >
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${getConfidenceColor(finding.confidence).replace('border-', 'bg-').replace('/20', '')}`}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{finding.diagnosis}</div>
                  <div className="text-sm text-gray-500">
                    Confidence: {finding.confidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default XRayImage; 