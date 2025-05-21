import pandas as pd

# Cargar el archivo Excel
df = pd.read_excel('Python_hacks/georef-mexico-municipality.xlsx')

# Diccionario de nombres de estados a IDs (con tildes incluidas)
estado_id_map = {
    'AGUASCALIENTES': 1,
    'BAJA CALIFORNIA': 2,
    'BAJA CALIFORNIA SUR': 3,
    'CAMPECHE': 4,
    'COAHUILA': 5,
    'COLIMA': 6,
    'CHIAPAS': 7,
    'CHIHUAHUA': 8,
    'CDMX': 9,
    'CIUDAD DE MÉXICO': 9,
    'DURANGO': 10,
    'GUANAJUATO': 11,
    'GUERRERO': 12,
    'HIDALGO': 13,
    'JALISCO': 14,
    'ESTADO DE MÉXICO': 15,
    'MÉXICO': 15,
    'MICHOACÁN': 16,
    'MORELOS': 17,
    'NAYARIT': 18,
    'NUEVO LEÓN': 19,
    'OAXACA': 20,
    'PUEBLA': 21,
    'QUERÉTARO': 22,
    'QUINTANA ROO': 23,
    'SAN LUIS POTOSÍ': 24,
    'SINALOA': 25,
    'SONORA': 26,
    'TABASCO': 27,
    'TAMAULIPAS': 28,
    'TLAXCALA': 29,
    'VERACRUZ': 30,
    'YUCATÁN': 31,
    'ZACATECAS': 32,
    'SIN ESTADO': 33
}

# Limpiar texto solo con strip y upper (respetando tildes)
df['State name'] = df['State name'].str.strip().str.upper().map(estado_id_map)

# Guardar como Excel
df.to_excel('municipios_estado_id_completo.xlsx', index=False)
print("Archivo guardado como 'municipios_estado_id_completo.xlsx'")
