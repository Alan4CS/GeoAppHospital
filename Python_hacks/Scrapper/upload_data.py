import pandas as pd
import psycopg2

# Cargar CSV
df = pd.read_csv("unidades_clinicas_imss.csv")

# Conectar a la base de datos
conn = psycopg2.connect(
    host="dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com",
    database="geoapp_qrj2",
    user="geoapp_qrj2_user",
    password="dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy"
)
cursor = conn.cursor()

actualizados = 0  # contador

for i, row in df.iterrows():
    nombre = row['nombre']
    lat = row['Latitud']
    lon = row['Longitud']
    coords = row['coordenadas']

    # Ejecutar el UPDATE
    cursor.execute("""
        UPDATE hospitals
        SET
            coordenadas_hospital = %s,
            latitud_hospital = %s,
            longitud_hospital = %s
        WHERE LOWER(nombre_hospital) = LOWER(%s) AND tipo_hospital = 'CLÍNICA'
    """, (coords, lat, lon, nombre))

    if cursor.rowcount > 0:
        actualizados += 1
        print(f"✅ Actualizado: {nombre}")
    else:
        print(f"⚠️ No encontrado: {nombre}")

# Guardar cambios
conn.commit()
cursor.close()
conn.close()

print(f"\n🔎 Total registros actualizados: {actualizados}")
