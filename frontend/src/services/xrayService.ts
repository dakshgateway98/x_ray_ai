import api from './api';

export interface XRayFinding {
  id: number;
  xray_id: number;
  diagnosis: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: string;
  created_at: string;
}

export interface XRay {
  id: number;
  patient_id: string;
  image_path: string;
  image_url: string;
  uploaded_at: string;
  clinical_notes?: string;
  diagnosis_status: 'pending' | 'processing' | 'completed' | 'failed';
  vision_analysis?: string;
  vector_search_results?: string;
  final_diagnosis?: string;
  confidence_score?: string;
  processing_error?: string;
  findings: XRayFinding[];
}

export interface XRayUploadData {
  patientId: string;
  file: File;
  clinicalNotes?: string;
}

export interface XRayUpdateData {
  clinicalNotes?: string;
}

export const uploadXRay = async (
  patientId: string,
  file: File,
  clinicalNotes?: string
): Promise<XRay> => {
  console.log('uploadXRay called with:', { patientId, file, clinicalNotes });
  console.log('File type:', typeof file);
  console.log('File instanceof File:', file instanceof File);
  console.log('File name:', file?.name);
  console.log('File size:', file?.size);
  
  const formData = new FormData();
  formData.append('patient_id', patientId);
  formData.append('file', file);
  if (clinicalNotes) {
    formData.append('clinical_notes', clinicalNotes);
  }
  
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await api.post('/xray/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getXRay = async (id: number): Promise<XRay> => {
  const response = await api.get(`/xray/${id}`);
  return response.data;
};

export const updateXRay = (id: number, data: XRayUpdateData): Promise<XRay> => {
  return api.put(`/xray/${id}`, data).then(res => res.data);
};

export const getPatientXrays = async (patientId: string): Promise<XRay[]> => {
  const response = await api.get(`/xray/patient/${patientId}`);
  return response.data;
};

export const rediagnoseXRay = async (id: number): Promise<XRay> => {
  const response = await api.post(`/xray/${id}/rediagnose`);
  return response.data;
};

export const deleteXRay = async (id: number): Promise<void> => {
  await api.delete(`/xray/${id}`);
}; 