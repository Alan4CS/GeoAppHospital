import pandas as pd
import folium

# Cargar tu archivo Excel
df = pd.read_excel("Python_hacks\Hospitales\hospitales_geocodificados.xlsx")

# Asegúrate de que estos campos existen
lat_col = 'latitud_corregida'
lon_col = 'longitud_corregida'
nombre_col = 'nombre_hospital'

# Filtra solo los hospitales con coordenadas válidas
df = df.dropna(subset=[lat_col, lon_col])

# Punto central del mapa (puedes ajustar o calcular promedio)
centro_lat = df[lat_col].mean()
centro_lon = df[lon_col].mean()

# Crear mapa base
mapa = folium.Map(location=[centro_lat, centro_lon], zoom_start=6)

# Agregar pines de hospitales
for _, row in df.iterrows():
    folium.Marker(
        location=[row[lat_col], row[lon_col]],
        popup=row[nombre_col],
        icon=folium.Icon(color='blue', icon='plus-sign')
    ).add_to(mapa)

# Guardar el mapa a un archivo HTML
mapa.save('mapa_hospitales.html')
print("✅ Mapa guardado como mapa_hospitales.html")
