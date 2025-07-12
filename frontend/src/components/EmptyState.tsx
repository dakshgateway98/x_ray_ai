import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  showAction?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "No Data Available",
  message = "No data available here.",
  actionText = "Upload an X-ray",
  actionLink = "/xray/upload",
  onAction,
  showAction = true
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {showAction && (
          onAction ? (
            <button
              onClick={handleAction}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              {actionText}
            </button>
          ) : (
            <Link to={actionLink} className="text-blue-500 hover:text-blue-700 font-medium">
              {actionText}
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default EmptyState; 