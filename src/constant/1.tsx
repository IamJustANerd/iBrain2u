// src/constant/1.tsx

export const patientData = {
  id: "1",
  name: "BUDI SANTOSO",
  age: 65,
  gender: "M",
  patientId: "882193",
  dob: "22/01/2026",
  scanMetadata: {
    totalSlices: 255,
    currentSlice: 120,
    ww: 80,
    wl: 40,
    zoom: "1.0X",
    thickness: "5mm",
  },
  aiAnalysis: {
    diagnosis: {
      clasification: {
        tumor: 0.94,
        stroke: 0.02,
        normal: 0.04
      },
      important_slice: [1, 76, 218, 260]
    },
    subtype: {
      clasification: {
        stroke_ischemic: 0.94,
        stroke_hemorrhagic: 0.02,
        calsification: 0.04
      },
      important_slice: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 218
      ],
      details: {
        clot_volume: 18.4,
        density: "+72",
        midline_shift: 4.2,
        dimensions: "4.4 x 3.8"
      },
      other_details: {
        ivh: "Positive",
        perilesional_edema: "present",
        intratumoral_hemorrhage: "none",
      }
    }, // Fixed: Added the missing closing bracket for subtype here
    stage: {
      clasification: {
        acute: 0.94,
        subacute: 0.02,
        chronic: 0.04
      },
      important_slice: [
        3,
        7,
        79,
        218
      ],
      estimated_onset: "0-24 hours"
    },
    doctor_notes: "Hello World",
    consistency: "Solid, Calcified",
    margins: "Well-circumscribed",
  },
  verificationStatus: "Menunggu Verifikasi Dokter",
};