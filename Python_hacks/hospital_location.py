import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, shape
import json
from sqlalchemy import create_engine

# Conexión a PostgreSQL
usuario = 'geoapp_qrj2_user'
contrasena = 'dVXCJV7oSHwdWiKDh8Kx6v7eAGrUrwjy'
host = 'dpg-d05uga2dbo4c7392lemg-a.oregon-postgres.render.com'
puerto = '5432'
bd = 'geoapp_qrj2'
conn_url = f"postgresql://{usuario}:{contrasena}@{host}:{puerto}/{bd}"
engine = create_engine(conn_url)

# 1. Leer hospitales
hospitales_df = pd.read_sql("""
    SELECT id_hospital, nombre_hospital, latitud_hospital, longitud_hospital
    FROM hospitals
    WHERE latitud_hospital IS NOT NULL AND longitud_hospital IS NOT NULL
""", engine)

# 2. Crear GeoDataFrame de hospitales
hospitales_gdf = gpd.GeoDataFrame(
    hospitales_df,
    geometry=gpd.points_from_xy(hospitales_df['longitud_hospital'], hospitales_df['latitud_hospital']),
    crs="EPSG:4326"
)

# 3. Leer municipios con geo_shape (como texto)
municipios_raw = pd.read_sql("""
    SELECT id_municipio, nombre_municipio, geo_shape
    FROM municipios
    WHERE geo_shape IS NOT NULL
""", engine)

# 4. Convertir geo_shape (GeoJSON) a shapely geometry
def parse_geojson(geojson_str):
    try:
        return shape(json.loads(geojson_str))
    except Exception as e:
        return None

municipios_raw['geometry'] = municipios_raw['geo_shape'].apply(parse_geojson)
municipios_gdf = gpd.GeoDataFrame(municipios_raw.dropna(subset=['geometry']), geometry='geometry', crs="EPSG:4326")

# 5. Join espacial: ¿en qué municipio cae cada hospital?
hospitales_con_municipio = gpd.sjoin(hospitales_gdf, municipios_gdf, how='left', predicate='within')

# 6. Mostrar primeros resultados
print(hospitales_con_municipio[['nombre_hospital', 'nombre_municipio','id_municipio']].dropna())

# 7. Filtrar columnas que quieres exportar
resultado = hospitales_con_municipio[['nombre_hospital','id_hospital', 'id_municipio', 'nombre_municipio']].dropna()

# 8. Exportar a CSV
resultado.to_excel('hospitales_con_municipio.xlsx', index=False)

# 9. Cerrar conexión
print("Archivo Excel generado: hospitales_con_municipio.xlsx")
