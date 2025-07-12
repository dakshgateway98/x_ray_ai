import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadXRay } from '@/services/xrayService';
import { getPatients } from '@/services/patientService';
import type { Patient } from '@/services/patientService';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';

const uploadSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  file: z.instanceof(File).refine((file) => file.size > 0, 'Please select a file'),
  clinicalNotes: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const UploadXRay: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await getPatients();
        setPatients(data);
        
        // Pre-select patient if patientId is provided in URL
        const patientIdFromUrl = searchParams.get('patientId');
        if (patientIdFromUrl) {
          setValue('patientId', patientIdFromUrl);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [searchParams, setValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    console.log('Form data:', data);
    console.log('File:', data.file);
    console.log('File type:', typeof data.file);
    console.log('File instanceof File:', data.file instanceof File);
    console.log('PatientId:', data.patientId);
    console.log('ClinicalNotes:', data.clinicalNotes);
    console.log('Selected file:', selectedFile);
    
    try {
      setUploading(true);
      // Use the selectedFile state if the form data file is not available
      const fileToUpload = data.file || selectedFile;
      if (!fileToUpload) {
        throw new Error('No file selected');
      }
      console.log('Calling uploadXRay with:', data.patientId, fileToUpload, data.clinicalNotes);
      await uploadXRay(data.patientId, fileToUpload, data.clinicalNotes);
      navigate(`/patients/${data.patientId}/xrays`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload X-ray. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-bold">Upload X-Ray</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Upload New X-Ray</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                Patient
              </label>
              <select
                id="patientId"
                disabled={loading}
                onChange={(e) => setValue('patientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.name} ({patient.patient_id})
                  </option>
                ))}
              </select>
              {errors.patientId && (
                <p className="text-sm text-red-600">{errors.patientId.message}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                X-Ray Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </label>
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
              {errors.file && (
                <p className="text-sm text-red-600">{errors.file.message}</p>
              )}
            </div>

            {/* Clinical Notes */}
            <div className="space-y-2">
              <label htmlFor="clinicalNotes" className="block text-sm font-medium text-gray-700">
                Clinical Notes (Optional)
              </label>
              <textarea
                id="clinicalNotes"
                placeholder="Enter any clinical notes, symptoms, or additional information..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                {...register('clinicalNotes')}
              />
              <p className="text-xs text-gray-500">
                Add any relevant clinical information that might help with the diagnosis.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload X-Ray
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadXRay; 