// src/components/TopNavbar.tsx
import Logo from "../assets/logo.png";
import ArrowLeft from "../assets/icons/gray/arrowLeft.svg";

interface TopNavbarProps {
  patient: any;
}

export default function TopNavbar({ patient }: TopNavbarProps) {
  return (
    <header className="h-12 sm:h-16 bg-gray-10 border-b-3 border-gray-6 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center">
        <button className="flex items-center bg-gray-8 hover:bg-gray-7 text-white text-[10px] sm:text-sm px-3 py-1 sm:px-6 sm:py-2 rounded transition-colors">
          <img
            src={ArrowLeft}
            className="mr-2 w-1/4 h-1/4 sm:w-auto sm:h-auto"
            alt="Back"
          />
          Back
        </button>
      </div>

      <div className="flex items-center text-white text-[12px] sm:text-lg font-bold">
        {patient.name} ({patient.age}/{patient.gender})
        <span className="text-gray-1 text-sm font-semibold ml-3 hidden md:inline">
          ID : {patient.patientId} | DOB : {patient.dob}
        </span>
      </div>

      <div className="flex flex-row items-end h-8 sm:h-12">
        <div className="h-full hidden sm:block">
          <div className="text-white font-bold tracking-wide text-right">
            iBrain2u
          </div>
          <div className="text-gray-1 text-[12px]">
            System deteksi gangguan otak berbasis AI
          </div>
        </div>
        <div className="h-full">
          <img src={Logo} className="ml-4 h-full" alt="Logo" />
        </div>
      </div>
    </header>
  );
}
