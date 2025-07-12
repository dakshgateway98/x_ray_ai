import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import UploadXRay from "./pages/UploadXRay";
import UploadBook from "./pages/UploadBook";
import ViewDiagnosis from "./pages/ViewDiagnosis";
import PatientXrays from "./pages/PatientXrays";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<NewPatient />} />
          <Route path="patients/:patientId/xrays" element={<PatientXrays />} />
          <Route path="xray/upload" element={<UploadXRay />} />
          <Route path="xray/:xrayId" element={<ViewDiagnosis />} />
          <Route path="books/upload" element={<UploadBook />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
