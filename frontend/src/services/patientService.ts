import api from './api';

export interface Patient {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  created_at: string;
}

export interface PatientCreate {
  name: string;
  date_of_birth: string; // YYYY-MM-DD format
  gender: string;
}

export const getPatients = (): Promise<Patient[]> => {
  return api.get('/patients/').then(res => res.data);
};

export const createPatient = (patient: PatientCreate): Promise<Patient> => {
  return api.post('/patients/', patient).then(res => res.data);
};

export const getPatient = (patientId: string): Promise<Patient> => {
  return api.get(`/patients/${patientId}`).then(res => res.data);
};

export const deletePatient = (patientId: string): Promise<{ message: string }> => {
  return api.delete(`/patients/${patientId}`).then(res => res.data);
}; 