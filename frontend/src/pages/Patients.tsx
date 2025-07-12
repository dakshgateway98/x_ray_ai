import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPatients, deletePatient, type Patient } from '@/services/patientService';
import { ConfirmationDialog } from '@/components';
import { Trash2, UserX, Plus } from 'lucide-react';

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      setError("Failed to fetch patients.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteDialog(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    
    try {
      setDeletingPatient(patientToDelete.patient_id);
      await deletePatient(patientToDelete.patient_id);
      
      // Remove the patient from the list
      setPatients(prev => prev.filter(p => p.patient_id !== patientToDelete.patient_id));
    } catch (err) {
      console.error('Failed to delete patient:', err);
      alert('Failed to delete patient. Please try again.');
    } finally {
      setDeletingPatient(null);
      setPatientToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchPatients}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Patients</h1>
            <Link 
              to="/patients/new" 
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </Link>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patients Found</h3>
              <p className="text-gray-600 mb-4">No patients have been added yet.</p>
              <Link 
                to="/patients/new"
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Add your first patient
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient.patient_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-lg font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <p>Age: {patient.age}</p>
                            <p>Gender: {patient.gender}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link 
                              to={`/patients/${patient.patient_id}/xrays`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View X-Rays
                            </Link>
                            <button
                              onClick={() => handleDeletePatient(patient)}
                              disabled={deletingPatient === patient.patient_id}
                              className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              {deletingPatient === patient.patient_id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setPatientToDelete(null);
        }}
        onConfirm={confirmDeletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patientToDelete?.name}? This will permanently delete the patient and all associated X-rays. This action cannot be undone.`}
        confirmText="Delete Patient"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default Patients;