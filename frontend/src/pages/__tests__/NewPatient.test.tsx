import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewPatient from '../NewPatient';

// Mock the patient service
jest.mock('@/services/patientService', () => ({
  createPatient: jest.fn().mockResolvedValue({}),
}));

describe('NewPatient Form', () => {
  test('renders the form correctly', () => {
    render(
      <BrowserRouter>
        <NewPatient />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save patient/i })).toBeInTheDocument();
  });

  test('shows validation errors for invalid input', async () => {
    render(
      <BrowserRouter>
        <NewPatient />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /save patient/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/invalid date format/i)).toBeInTheDocument();
  });
}); 