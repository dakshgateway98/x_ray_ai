import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientXrays, rediagnoseXRay, deleteXRay } from '@/services/xrayService';
import { getPatient, deletePatient } from '@/services/patientService';
import type { XRay } from '@/services/xrayService';
import type { Patient } from '@/services/patientService';
import { XRayCard, EmptyState, ConfirmationDialog } from '@/components';
import { ArrowLeft, Trash2, UserX } from 'lucide-react';

const PatientXrays: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [xrays, setXrays] = useState<XRay[]>([]);
  const [loading, setLoading] = useState(true);
  const [rediagnosing, setRediagnosing] = useState<number | null>(null);
  const [deletingXray, setDeletingXray] = useState<number | null>(null);
  const [deletingPatient, setDeletingPatient] = useState(false);
  const [showDeletePatientDialog, setShowDeletePatientDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [patientData, xraysData] = await Promise.all([
          getPatient(patientId),
          getPatientXrays(patientId)
        ]);
        
        setPatient(patientData);
        setXrays(xraysData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleRediagnose = async (xrayId: number) => {
    try {
      setRediagnosing(xrayId);
      const updatedXray = await rediagnoseXRay(xrayId);
      
      // Update the X-ray in the list
      setXrays(prev => prev.map(xray => 
        xray.id === xrayId ? updatedXray : xray
      ));
    } catch (err) {
      console.error('Failed to re-diagnose X-ray:', err);
      alert('Failed to re-diagnose X-ray. Please try again.');
    } finally {
      setRediagnosing(null);
    }
  };

  const handleDeleteXray = async (xrayId: number) => {
    try {
      setDeletingXray(xrayId);
      await deleteXRay(xrayId);
      
      // Remove the X-ray from the list
      setXrays(prev => prev.filter(xray => xray.id !== xrayId));
    } catch (err) {
      console.error('Failed to delete X-ray:', err);
      alert('Failed to delete X-ray. Please try again.');
    } finally {
      setDeletingXray(null);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientId) return;
    
    try {
      setDeletingPatient(true);
      await deletePatient(patientId);
      navigate('/patients');
    } catch (err) {
      console.error('Failed to delete patient:', err);
      alert('Failed to delete patient. Please try again.');
    } finally {
      setDeletingPatient(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
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
            <h1 className="text-2xl font-bold">Patient X-Rays</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'Patient not found'}</p>
              <button
                onClick={() => navigate('/patients')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Back to Patients
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <p className="text-gray-600">
                  Patient ID: {patient.patient_id} | Age: {patient.age} | Gender: {patient.gender}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDeletePatientDialog(true)}
              disabled={deletingPatient}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <UserX className="h-4 w-4" />
              {deletingPatient ? 'Deleting...' : 'Delete Patient'}
            </button>
          </div>

          {/* X-Rays Grid */}
          {xrays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {xrays.map((xray) => (
                <XRayCard
                  key={xray.id}
                  xray={xray}
                  onRediagnose={handleRediagnose}
                  onDelete={handleDeleteXray}
                  rediagnosing={rediagnosing}
                  deleting={deletingXray}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <EmptyState
                title="No X-Rays Available"
                message="No data available here."
                actionText="Upload X-Ray"
                onAction={() => navigate(`/upload-xray?patientId=${patient.patient_id}`)}
                showAction={true}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeletePatientDialog}
        onClose={() => setShowDeletePatientDialog(false)}
        onConfirm={handleDeletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patient.name}? This will also delete all associated X-rays and cannot be undone.`}
        confirmText="Delete Patient"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default PatientXrays; 