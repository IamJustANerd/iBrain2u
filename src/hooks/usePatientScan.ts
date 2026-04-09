// src/hooks/usePatientScan.ts
import { useState, useEffect, useRef } from "react";

const SERVER_URL = "http://127.0.0.1:8000";

export function usePatientScan(
  id: string | undefined,
  // We accept the Vite glob object directly from the parent component
  patientModules: Record<string, () => Promise<any>>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patient, setPatient] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverMeta, setServerMeta] = useState<any>(null);
  const [axis, setAxis] = useState<"axial" | "sagittal" | "coronal">("axial");
  const [maxFrames, setMaxFrames] = useState(100);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [activeImageSrc, setActiveImageSrc] = useState<string>("");

  const imageBlobCache = useRef<Map<string, string>>(new Map());
  const fetchingSet = useRef<Set<string>>(new Set());

  // === FETCH PATIENT & INIT SERVER ===
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        const path = `./constant/${id}.tsx`;
        if (patientModules[path]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const module = (await patientModules[path]()) as any;
          setPatient(module.patientData);
        } else {
          console.error(`File not found in patientModules for path: ${path}`);
        }
      } catch (err) {
        console.error("Failed to load patient data:", err);
      }
    };

    const initServerSession = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pacsid: id || "UNKNOWN",
            date: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to open server session");

        const data = await res.json();
        setSessionId(data.session_id);
        setServerMeta(data);

        if (data.sequences && data.sequences.length > 0) {
          const shape = data.analyses[data.sequences[0]].shape;
          setMaxFrames(shape[2]);
          setCurrentFrame(0);
        }
      } catch (err) {
        console.error("Server connection error:", err);
      }
    };

    if (id) {
      fetchPatientData();
      initServerSession();
    }
  }, [id, patientModules]);

  // === HANDLE AXIS SWITCHING ===
  useEffect(() => {
    if (serverMeta) {
      const shape = serverMeta.analyses[serverMeta.sequences[0]].shape;
      let newMax = 100;
      if (axis === "axial") newMax = shape[2];
      if (axis === "coronal") newMax = shape[1];
      if (axis === "sagittal") newMax = shape[0];

      setMaxFrames(newMax);
      setCurrentFrame(0);
    }
  }, [axis, serverMeta]);

  // === FETCH AND CACHE ACTIVE IMAGE ===
  useEffect(() => {
    const fetchImageToCache = async () => {
      if (!sessionId || !serverMeta) return;

      const cacheKey = `${axis}-${currentFrame}`;

      if (imageBlobCache.current.has(cacheKey)) {
        setActiveImageSrc(imageBlobCache.current.get(cacheKey)!);
        return;
      }

      fetchingSet.current.add(cacheKey);
      const seqCode = serverMeta.sequences[0];
      const sliceIdx = Math.max(0, currentFrame - 1);
      const url = `${SERVER_URL}/view/${sessionId}/${seqCode}/${axis}/${sliceIdx}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch slice");
        const blob = await response.blob();

        const localUrl = URL.createObjectURL(blob);
        imageBlobCache.current.set(cacheKey, localUrl);
        setActiveImageSrc(localUrl);
      } catch (error) {
        console.error("Image fetch error:", error);
      } finally {
        fetchingSet.current.delete(cacheKey);
      }
    };

    fetchImageToCache();
  }, [currentFrame, axis, sessionId, serverMeta]);

  // === SMART OUTWARD BACKGROUND LOADER ===
  useEffect(() => {
    if (!sessionId || !serverMeta) return;

    let isCancelled = false;

    const prefetchOutward = async () => {
      const allFrames = Array.from({ length: maxFrames }, (_, i) => i + 1);
      allFrames.sort(
        (a, b) => Math.abs(a - currentFrame) - Math.abs(b - currentFrame)
      );

      for (const i of allFrames) {
        if (isCancelled) break;
        const cacheKey = `${axis}-${i}`;

        if (!imageBlobCache.current.has(cacheKey) && !fetchingSet.current.has(cacheKey)) {
          fetchingSet.current.add(cacheKey);

          const seqCode = serverMeta.sequences[0];
          const sliceIdx = Math.max(0, i - 1);
          const url = `${SERVER_URL}/view/${sessionId}/${seqCode}/${axis}/${sliceIdx}`;

          try {
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              imageBlobCache.current.set(cacheKey, URL.createObjectURL(blob));
            }
          } catch (error) {
            // Silently ignore prefetch errors
          } finally {
            fetchingSet.current.delete(cacheKey);
          }

          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }
    };

    prefetchOutward();
    return () => { isCancelled = true; };
  }, [sessionId, axis, maxFrames, serverMeta, currentFrame]);

  return {
    patient,
    sessionId,
    axis,
    setAxis,
    maxFrames,
    currentFrame,
    setCurrentFrame,
    activeImageSrc,
  };
}