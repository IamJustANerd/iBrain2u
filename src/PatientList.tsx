// src/pages/PatientList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo2 from "./assets/logo_2.svg";
import DarkLightMode from "./assets/icons/blue/darkLightMode.svg";
import Refresh from "./assets/icons/gray/refresh.svg";
import Search from "./assets/icons/gray/search.svg";

// Dummy Data exactly as shown in the mockup
const DUMMY_PATIENTS = [
  { id: "1", rm: "RM001234", name: "Alexander Bruno", date: "2026-02-07 14:30", age: 58, gender: "Laki-laki", status: "Analyzed" },
  { id: "2", rm: "RM001235", name: "Ahmad Hidayat", date: "2026-02-07 10:15", age: 62, gender: "Perempuan", status: "Verified" },
  { id: "3", rm: "RM001236", name: "Siti Rahayu", date: "2026-02-06 16:45", age: 45, gender: "Laki-laki", status: "Pending" },
  { id: "4", rm: "RM001237", name: "Dewi Lestari", date: "2026-02-06 09:20", age: 71, gender: "Perempuan", status: "Analyzed" },
  { id: "5", rm: "RM001238", name: "Eko Prasetyo", date: "2026-02-05 13:50", age: 38, gender: "Laki-laki", status: "Verified" },
  { id: "6", rm: "RM001239", name: "Rina Kusuma", date: "2026-02-05 11:30", age: 55, gender: "Perempuan", status: "Analyzed" },
  { id: "7", rm: "RM001240", name: "Bambang Wijaya", date: "2026-02-04 15:00", age: 67, gender: "Laki-laki", status: "Pending" },
  { id: "8", rm: "RM001241", name: "Linda Susanti", date: "2026-02-04 08:45", age: 52, gender: "Perempuan", status: "Verified" },
  // Adding a few more to test the scroll functionality!
  { id: "9", rm: "RM001242", name: "Budi Santoso", date: "2026-02-03 14:00", age: 65, gender: "Laki-laki", status: "Pending" },
  { id: "10", rm: "RM001243", name: "Sari Indah", date: "2026-02-03 09:15", age: 42, gender: "Perempuan", status: "Analyzed" },
];

export default function PatientList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("SEMUA");

  const handleNavigate = (id: string) => {
    navigate(`/pasien/${id}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Analyzed":
        return "bg-status-analyzed-bg";
      case "Verified":
        return "bg-status-verified-bg";
      case "Pending":
        return "bg-status-pending-bg";
      default:
        return "bg-gray-6 text-white border-gray-5";
    }
  };

  return (
    // 1. Changed to h-screen and overflow-hidden to lock the page from scrolling
    <div className="h-screen overflow-hidden bg-gray-11 font-['Plus_Jakarta_Sans'] text-white flex flex-col">
      
      {/* Top Header Placeholder */}
      <header className="flex justify-between items-center px-6 py-4 bg-gray-10 border-b border-gray-7 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo Placeholder */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold">
            <img src={Logo2} alt="Logo" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">iBrain2u</h1>
            <p className="text-xs text-gray-1">System deteksi gangguan otak berbasis AI</p>
          </div>
        </div>
        {/* Theme Toggle Placeholder */}
        <div className="flex items-center my-auto w-16 h-8 p-1 cursor-pointer relative">
          <img src={DarkLightMode} alt="Toggle Theme" />
        </div>
      </header>

      {/* Main Content */}
      {/* 2. Added min-h-0 so the flex child knows it's allowed to shrink and scroll */}
      <main className="flex-1 min-h-0 p-8 flex flex-col max-w-[1400px] w-full mx-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold">DAFTAR PASIEN</h2>
          <button className="flex items-center gap-2 bg-gray-7 hover:bg-gray-6 px-4 py-2 rounded text-sm transition-colors border border-gray-5">
            <img src={Refresh} alt="Refresh" />
            Refresh
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-3 border-gray-7 rounded-xl gap-4 bg-gray-12 shrink-0">
            {/* Search Input */}
            <div className="relative w-full md:w-[400px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-1">
                <img src={Search} alt="Search" />
              </div>
              <input
                type="text"
                placeholder="Cari Nama Pasien atau No.RM"
                className="w-full bg-gray-10 border-2 border-gray-5 text-white text-sm rounded-md pl-10 pr-4 py-3 focus:outline-none focus:border-blue-1 transition-colors placeholder:text-gray-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-6 text-sm font-semibold text-gray-1 border-gray-5 bg-gray-10 rounded-xl border-2 p-2.5">
              {["SEMUA", "PENDING", "ANALYZED", "VERIFIED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`transition-colors pb-1 px-1 border-b-2 ${
                    filter === f ? "text-white border-white" : "border-transparent hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Data */}
          {/* 3. Added overflow-auto to enable scrolling specifically inside this box */}
          <div className="overflow-auto custom-scrollbar border-3 border-gray-5 bg-gray-9 rounded-xl flex-1 mt-6 relative min-h-0">
            <table className="w-full text-left border-collapse min-w-[900px]">
              {/* 4. Added sticky top-0 to the header so it floats above the scrolling content */}
              <thead className="sticky top-0 z-10 bg-gray-9 shadow-[0_2px_0_0_var(--color-gray-7)]">
                <tr className="text-white font-semibold">
                  <th className="py-4 px-6 font-semibold">No. RM</th>
                  <th className="py-4 px-6 font-semibold">Nama Pasien</th>
                  <th className="py-4 px-6 font-semibold">Tanggal/Waktu MRI</th>
                  <th className="py-4 px-6 font-semibold">Usia</th>
                  <th className="py-4 px-6 font-semibold">Gender</th>
                  <th className="py-4 px-6 font-semibold text-center">Status</th>
                  <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {DUMMY_PATIENTS.map((p, idx) => (
                  <tr
                    key={idx}
                    className="border-b-2 border-gray-7 bg-gray-5 hover:bg-gray-13 transition-colors text-sm"
                  >
                    <td className="py-4 px-6 text-gray-1">{p.rm}</td>
                    <td className="py-4 px-6 text-white">{p.name}</td>
                    <td className="py-4 px-6 text-gray-1">{p.date}</td>
                    <td className="py-4 px-6 text-gray-1">{p.age} tahun</td>
                    <td className="py-4 px-6 text-gray-1">{p.gender}</td>
                    <td className="py-4 px-6 text-center">
                      {/* 5. Changed to inline-flex with fixed w-24 h-8 to force uniform badge sizes */}
                      <span className={`inline-flex items-center justify-center w-24 h-8 rounded-full text-xs font-semibold ${getStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleNavigate(p.id)}
                        className="bg-blue-1 hover:bg-blue-2 text-white px-4 py-1.5 rounded text-xs font-semibold transition-colors"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}