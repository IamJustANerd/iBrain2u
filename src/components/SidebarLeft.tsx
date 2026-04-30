// src/components/SidebarLeft.tsx
export default function SidebarLeft() {
  const modes = ["T1 Bravo", "T1 Contrast", "T1", "T2", "DWI", "SWAN", "GRE", "ADC", "FLAIR"];

  return (
    <aside className="w-16 sm:w-24 items-center bg-gray-11 border-r-3 border-gray-6 flex flex-col gap-3 p-3 shrink-0 custom-scrollbar">
      {modes.map((mode) => (
        <button
          key={mode}
          className={`flex flex-col items-center justify-center text-white h-12 sm:h-16 w-12 sm:w-16 rounded border-3 ${
            mode === "T2 W"
              ? "border-blue-1"
              : "border-gray-5 hover:border-gray-3"
          }`}
        >
          <div className="w-full h-full bg-gray-6"></div>
          <span className="text-[10px] font-semibold py-1">{mode}</span>
        </button>
      ))}
    </aside>
  );
}
