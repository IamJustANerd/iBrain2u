import io
import random
import string
import numpy as np
import nibabel as nib

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# ─────────────────────────────────────────
#  CONFIG — change this to your NIfTI path
# ─────────────────────────────────────────
NIFTI_PATH = "./original_stripped.nii.gz"

# ─────────────────────────────────────────
#  In-memory stores
# ─────────────────────────────────────────
sessions: dict = {}          # session_id → study_key
study_cache: dict = {}       # study_key  → { data, shape, sequences, analyses }

app = FastAPI()

# To connect with front end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────
def make_session_id(n=6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def load_nifti(path: str) -> dict:
    img   = nib.load(path)
    data  = np.array(img.dataobj)           # full volume, float-safe
    shape = data.shape                      # (X, Y, Z) or (X, Y, Z, T)

    # treat each 3D volume (or the only one) as a "sequence"
    n_vols     = shape[3] if data.ndim == 4 else 1
    sequences  = [f"SEQ{str(i+1).zfill(3)}" for i in range(n_vols)]

    analyses = {}
    for i, seq in enumerate(sequences):
        vol = data[..., i] if data.ndim == 4 else data
        analyses[seq] = {
            "shape":    list(vol.shape),
            "min":      float(np.min(vol)),
            "max":      float(np.max(vol)),
            "mean":     round(float(np.mean(vol)), 4),
            "nonzero":  int(np.count_nonzero(vol)),
        }

    return {
        "data":      data,
        "shape":     shape,
        "sequences": sequences,
        "analyses":  analyses,
    }

def get_slice(data: np.ndarray, seq_code: str, sequences: list,
              axis: str, slice_idx: int) -> np.ndarray:

    seq_idx = sequences.index(seq_code)
    vol = data[..., seq_idx] if data.ndim == 4 else data   # 3D volume

    axis_map = {"axial": 2, "coronal": 1, "sagittal": 0}
    ax = axis_map.get(axis.lower())
    if ax is None:
        raise HTTPException(400, f"axis must be axial | coronal | sagittal, got '{axis}'")

    max_idx = vol.shape[ax] - 1
    if not (0 <= slice_idx <= max_idx):
        raise HTTPException(400, f"slice_idx out of range [0, {max_idx}]")

    sl = np.take(vol, slice_idx, axis=ax)
    return sl

def array_to_png(arr: np.ndarray) -> bytes:
    arr = arr.astype(np.float32)
    lo, hi = arr.min(), arr.max()
    if hi > lo:
        arr = (arr - lo) / (hi - lo) * 255
    else:
        arr = np.zeros_like(arr)
    img = Image.fromarray(arr.astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

# ─────────────────────────────────────────
#  Endpoints
# ─────────────────────────────────────────
class OpenPayload(BaseModel):
    pacsid: str
    date: str

@app.post("/open")
def open_session(payload: OpenPayload):
    study_key = f"{payload.pacsid}:{payload.date}"

    # load NIfTI once, reuse across sessions
    if study_key not in study_cache:
        try:
            study_cache[study_key] = load_nifti(NIFTI_PATH)
        except FileNotFoundError:
            raise HTTPException(404, f"NIfTI file not found: {NIFTI_PATH}")

    # create short session id, ensure unique
    sid = make_session_id()
    while sid in sessions:
        sid = make_session_id()

    sessions[sid] = study_key

    meta = study_cache[study_key]
    return {
        "session_id": sid,
        "sequences":  meta["sequences"],
        "analyses":   meta["analyses"],
    }


@app.get("/view/{session_id}/{seq_code}/{axis}/{slice_idx}")
def view_slice(session_id: str, seq_code: str, axis: str, slice_idx: int):
    if session_id not in sessions:
        raise HTTPException(403, "Invalid or expired session_id")

    study_key = sessions[session_id]
    meta      = study_cache[study_key]

    if seq_code not in meta["sequences"]:
        raise HTTPException(404, f"seq_code '{seq_code}' not found. "
                                 f"Available: {meta['sequences']}")

    sl      = get_slice(meta["data"], seq_code, meta["sequences"], axis, slice_idx)
    png     = array_to_png(sl)

    return StreamingResponse(io.BytesIO(png), media_type="image/png")


# ─────────────────────────────────────────
#  Run: uvicorn server:app --reload
# ─────────────────────────────────────────
