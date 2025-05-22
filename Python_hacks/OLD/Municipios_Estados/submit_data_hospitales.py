import pandas as pd
from sqlalchemy import create_engine, text

# Leer el archivo Excel
df = pd.read_excel('hospitales_con_municipio.xlsx').dropna(subset=['id_municipio', 'id_hospital'])

# Conexión a la base de datos
usuario = 'geoapp_qrj2_user'
contrasena = 'dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy'
host = 'dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com'
puerto = '5432'
bd = 'geoapp_qrj2'
conn_url = f"postgresql://{usuario}:{contrasena}@{host}:{puerto}/{bd}"
engine = create_engine(conn_url)

# Ejecutar actualizaciones y confirmar transacción
with engine.begin() as conn:  # <-- esta línea es la clave
    for _, row in df.iterrows():
        result = conn.execute(
            text("""
                UPDATE hospitals
                SET id_municipio = :id_municipio
                WHERE id_hospital = :id_hospital
            """),
            {
                'id_municipio': int(row['id_municipio']),
                'id_hospital': int(row['id_hospital'])
            }
        )
        if result.rowcount > 0:
            print(f"✅ Hospital ID {row['id_hospital']} actualizado con municipio {row['id_municipio']}")
        else:
            print(f"⚠️  No se encontró hospital con ID {row['id_hospital']}")

print("\n🏁 Proceso completado.")
