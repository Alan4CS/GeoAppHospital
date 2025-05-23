
# 🐍 Guía para Ejecutar la Aplicación Python (FastAPI + PostgreSQL)

## ✅ Requisitos Previos

Asegúrate de tener instalado:

- Python 3.10 o superior
- `pip` (ya viene con Python)
- PostgreSQL (una base de datos activa, o usar Render como en este caso)

---

## 📦 Instalar dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary
```

---

## 📁 Estructura del proyecto

```
/GeoAppHospital/
│
├── main.py               # Script principal de FastAPI
├── /static/              # Carpeta con tu archivo index.html y recursos estáticos
│   └── index.html
```

---

## 🚀 Ejecutar el servidor

Desde la raíz del proyecto, corre:

```bash
uvicorn main:app --reload
```

y si no te jala hazlo con este comando

```bash
python -m uvicorn main:app --reload

```

Esto iniciará el servidor en:

```
http://127.0.0.1:8000
```

---

## 🌐 Acceder a la interfaz web

Abre tu navegador y ve a:

```
http://127.0.0.1:8000
```

Ahí podrás:

- Seleccionar un estado
- Ver un hospital con sus coordenadas
- Editar su ubicación
- Dibujar una geocerca
- Guardar los cambios en la base de datos

---

## 🛠 Notas técnicas

- El archivo `main.py` conecta a una base de datos PostgreSQL remota.
- El frontend (HTML) se sirve desde la carpeta `/static`.
- Los cambios se almacenan en la tabla `hospitals`, incluyendo `latitud`, `longitud`, `coordenadas`, `geo_shape` y `reviewed`.

---

## 🧯 Errores comunes

### ⚠️ `uvicorn: command not found`

Solución:

```bash
pip install uvicorn
```

O ejecútalo así si usas Windows:

```bash
python -m uvicorn main:app --reload
```

### ⚠️ Error de tipo al guardar `geojson`

Solución:
- Asegúrate de que la columna `geo_shape` o `radio_geo` sea `TEXT` o `JSONB`.
- Usa `json.dumps()` al guardar JSON en la base de datos.
