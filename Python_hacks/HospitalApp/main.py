from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import random
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Conexión a PostgreSQL
engine = create_engine("postgresql://geoapp_qrj2_user:dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy@dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com:5432/geoapp_qrj2")

@app.get("/estados")
def estados():
    query = "SELECT DISTINCT nombre_estado FROM hospitals JOIN estados ON hospitals.estado_id = estados.id_estado WHERE reviewed = false"
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [r[0] for r in result]

@app.get("/hospital")
def hospital(estado: str):
    print("➡️ Estado recibido:", estado)
    query = """
    SELECT h.id_hospital, h.direccion_hospital ,h.nombre_hospital, h.latitud_hospital, h.longitud_hospital
    FROM hospitals h
    JOIN estados e ON h.estado_id = e.id_estado
    WHERE e.nombre_estado = :nombre_estado
      AND h.reviewed = false
      AND h.latitud_hospital IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
    """
    with engine.connect() as conn:
        result = conn.execute(text(query), {"nombre_estado": estado}).fetchone()
        if not result:
            print(f"⚠️  No se encontró hospital en: {estado}")
        return dict(result._mapping) if result else {}

class HospitalUpdate(BaseModel):
    id_hospital: int
    latitud: float
    longitud: float
    geojson: dict | None = None

@app.post("/guardar")
def guardar(data: HospitalUpdate):
    coords_text = f"{data.longitud}, {data.latitud}"
    geofence_geojson = str(data.geojson) if data.geojson else None

    query = """
    UPDATE hospitals
    SET latitud_hospital = :lat,
        longitud_hospital = :lon,
        coordenadas_hospital = :coord,
        radio_geo = :geojson,
        reviewed = true
    WHERE id_hospital = :id
    """
    with engine.begin() as conn:
        conn.execute(text(query), {
            "lat": data.latitud,
            "lon": data.longitud,
            "coord": coords_text,
            "geojson": geofence_geojson,
            "id": data.id_hospital
        })
    return {"status": "ok"}


# Montar carpeta de archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return FileResponse(os.path.join("static", "index.html"))