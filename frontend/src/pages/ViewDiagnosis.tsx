import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getXRay, rediagnoseXRay } from '@/services/xrayService';
import type { XRay } from '@/services/xrayService';
import { DiagnosisInfo, XRayImage } from '@/components';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const ViewDiagnosis: React.FC = () => {
  console.log('ViewDiagnosis');
  const { xrayId: xrayid } = useParams<{ xrayId: string }>();
  const navigate = useNavigate();
  const [xray, setXray] = useState<XRay | null>(null);
  const [loading, setLoading] = useState(true);
  const [rediagnosing, setRediagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchXRay = async () => {
      console.log('fetchXRay called with id:', xrayid);
      
      if (!xrayid) {
        console.log('No id provided, returning');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Setting loading to true');
        setLoading(true);
        setError(null);
        
        console.log('Calling getXRay with id:', parseInt(xrayid));
        const data = await getXRay(parseInt(xrayid));
        console.log('getXRay response:', data);
        setXray(data);
      } catch (err: any) {
        console.error('Failed to fetch X-ray:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load X-ray details');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchXRay();
  }, [xrayid]);

  const handleRediagnose = async () => {
    if (!xray) return;

    try {
      setRediagnosing(true);
      const updatedXray = await rediagnoseXRay(xray.id);
      setXray(updatedXray);
    } catch (err) {
      console.error('Failed to re-diagnose X-ray:', err);
      alert('Failed to re-diagnose X-ray. Please try again.');
    } finally {
      setRediagnosing(false);
    }
  };

  const handleXrayUpdate = (updatedXray: XRay) => {
    setXray(updatedXray);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading X-ray details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !xray) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold">X-Ray Details</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'X-ray not found'}</p>
              <button
                onClick={() => navigate(-1)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-bold">X-Ray Diagnosis</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image with Overlays */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <XRayImage 
                imageUrl={xray.image_url} 
                title="X-Ray Image with Findings" 
                findings={xray.findings}
              />
            </div>
          </div>

          {/* Right Column - Diagnosis Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <DiagnosisInfo
                xray={xray}
                onRediagnose={handleRediagnose}
                rediagnosing={rediagnosing}
                onUpdate={handleXrayUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDiagnosis; 