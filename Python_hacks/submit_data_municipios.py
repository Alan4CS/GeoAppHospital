import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
import traceback

# Configura la ruta de tu archivo
xlsx_path = 'Python_hacks\\municipios_estado_id_completo.xlsx'

# Lee el Excel
df = pd.read_excel(xlsx_path)
print("✅ Excel cargado correctamente")
print("📋 Columnas detectadas:", df.columns.tolist())

# Configura la conexión a PostgreSQL
usuario = 'geoapp_qrj2_user'
contrasena = 'dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy'
host = 'dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com'
puerto = '5432'
base_datos = 'geoapp_qrj2'
tabla_destino = 'municipios'

# Crea la URL de conexión y el motor
conexion_url = f'postgresql+psycopg2://{usuario}:{contrasena}@{host}:{puerto}/{base_datos}'
engine = create_engine(conexion_url)

# Inserta con manejo de errores
with engine.begin() as conn:
    try:
        df.to_sql(tabla_destino, conn, index=False, if_exists='append')
        print(f"✅ Datos insertados correctamente en la tabla '{tabla_destino}'.")
    except SQLAlchemyError as e:
        print("❌ Error al insertar datos en la base de datos:")
        traceback.print_exc()
