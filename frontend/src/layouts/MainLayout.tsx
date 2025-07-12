import { NavLink, Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">X-Ray Diagnosis</h1>
        <nav>
          <ul>
            <li><NavLink to="/" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</NavLink></li>
            <li><NavLink to="/patients" className="block py-2 px-4 rounded hover:bg-gray-700">Patients</NavLink></li>
            <li><NavLink to="/xray/upload" className="block py-2 px-4 rounded hover:bg-gray-700">Upload X-Ray</NavLink></li>
            <li><NavLink to="/books/upload" className="block py-2 px-4 rounded hover:bg-gray-700">Upload Book</NavLink></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout; 