from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import pandas as pd
import time
import re

# Configuración de Selenium
options = Options()
driver = webdriver.Chrome(service=Service(), options=options)

base_url = "https://www.imss.gob.mx"
url = f"{base_url}/directorio/"
driver.get(url)
time.sleep(3)

# Seleccionar "Clínica"
Select(driver.find_element(By.ID, "tipounidadselect")).select_by_visible_text("IMSS Bienestar")
print("✔ Clínica seleccionada")

# Clic en botón de búsqueda
driver.find_element(By.XPATH, '//button[contains(@onclick, "myFunctionClick")]').click()
time.sleep(5)

# Punto de reinicio
punto_inicio = "PUEBLO NUEVO (SAN BARTOLO TUTOTEPEC)"
empezar = False  # Comenzar a guardar hasta encontrar ese punto

data = []
pagina = 1
limite_paginas = 400

while pagina <= limite_paginas:
    print(f"\n📄 Procesando página {pagina}...")

    soup = BeautifulSoup(driver.page_source, 'html.parser')
    enlaces = soup.find_all('a', href=re.compile(r"maps\.google\.com.*\?q="))
    print(f" - Unidades en esta página: {len(enlaces)}")

    for link in enlaces:
        href = link.get('href')
        coords = re.search(r"q=(-?\d+\.\d+),(-?\d+\.\d+)", href)
        if not coords:
            continue

        latitud, longitud = coords.groups()
        img = link.find('img', alt=True)
        nombre = img['alt'].strip().split('<br')[0].strip() if img else "Nombre no encontrado"

        # Activar guardado al encontrar el punto de inicio
        if not empezar:
            if nombre == punto_inicio:
                empezar = True
                print(f"🔁 Punto de reinicio encontrado: {nombre} — comenzando a guardar...")

        if empezar:
            data.append({
                'nombre': nombre,
                'Latitud': latitud,
                'Longitud': longitud,
                'coordenadas': f"{latitud},{longitud}"
            })

    # Intentar avanzar a la siguiente página
    try:
        siguiente_boton = driver.find_element(By.XPATH, f'//a[@title="Ir a la página {pagina + 1}"]')
        driver.execute_script("arguments[0].click();", siguiente_boton)
        print(f"➡️ Click en botón de página {pagina + 1}")

        WebDriverWait(driver, 2000).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, "ajax-progress-throbber"))
        )

        pagina += 1
    except Exception as e:
        print("⛔ No se encontró el botón o error al hacer clic:", e)
        break

driver.quit()

# Guardar en CSV
df = pd.DataFrame(data)
df.to_csv("unidades_bienestar_imss_reanudado.csv", index=False, encoding='utf-8-sig')
print(f"\n✅ Total de unidades nuevas guardadas: {len(data)}")
print("📁 Archivo generado: unidades_bienestar_imss_reanudado.csv")
