import pandas as pd
import requests
import time
from sqlalchemy import create_engine

# Tu API Key de Google
API_KEY = 'AIzaSyDygqbhqmJ7EWb4E2v6wzPe-QNpYLZW230'
GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

# Conexión a la base de datos
usuario = 'geoapp_qrj2_user'
contrasena = 'dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy'
host = 'dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com'
puerto = '5432'
bd = 'geoapp_qrj2'
conn_url = f"postgresql://{usuario}:{contrasena}@{host}:{puerto}/{bd}"
engine = create_engine(conn_url)

# Leer hospitales desde la BD
query = """
    SELECT id_hospital, nombre_hospital, latitud_hospital, longitud_hospital, e.nombre_estado, m.nombre_municipio
    FROM hospitals h
    JOIN estados e
        ON e.id_estado = h.estado_id
    JOIN municipios m
        ON m.id_municipio = h.id_municipio
    WHERE nombre_hospital IS NOT NULL
"""
df = pd.read_sql(query, engine)

# Geocodificar con Google
for idx, row in df.iterrows():
    nombre = row['nombre_hospital']
    estado = row['nombre_estado']
    municipio = row['nombre_municipio']
    direccion = f"{nombre}, {estado}, {municipio}"  # puedes agregar municipio/estado si lo tienes

    params = {
        'address': direccion,
        'key': API_KEY
    }

    try:
        response = requests.get(GEOCODE_URL, params=params)
        data = response.json()

        if data['status'] == 'OK':
            loc = data['results'][0]['geometry']['location']
            df.at[idx, 'latitud_corregida'] = loc['lat']
            df.at[idx, 'longitud_corregida'] = loc['lng']
            print(f"✅ {nombre}: {loc['lat']}, {loc['lng']}")
        else:
            print(f"⚠️  No encontrado: {nombre} - {data['status']}")
    except Exception as e:
        print(f"❌ Error con {nombre}: {e}")

    time.sleep(0.2)  # evita exceso de peticiones

# Guardar resultados en un Excel
df.to_excel('hospitales_geocodificados.xlsx', index=False)
print("📄 Archivo generado: hospitales_geocodificados.xlsx")
