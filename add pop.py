import json
import csv

def coords_are_close(lat1, lon1, lat2, lon2, threshold=0.05):
    return abs(lat1 - lat2) <= threshold and abs(lon1 - lon2) <= threshold

# Charger les populations depuis worldcities.csv
populations_csv = {}
with open("worldcities.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 10:
            name = row[0].strip().lower()
            try:
                lat = float(row[2])
                lon = float(row[3])
            except ValueError:
                continue
            population = row[9].strip()
            if population.isdigit():
                populations_csv.setdefault(name, []).append({
                    "lat": lat,
                    "lon": lon,
                    "population": int(population)
                })

# Charger les populations depuis out2.json
populations_json2 = {}
with open("out2.json", encoding="utf-8") as f2:
    content = f2.read().strip()
    if content:
        data2 = json.loads(content)
        for entry in data2:
            name = entry.get("name", "").strip().lower()
            lat = entry.get("lat")
            lon = entry.get("lng")
            population = entry.get("population")
            if isinstance(population, int) and isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                populations_json2.setdefault(name, []).append({
                    "lat": lat,
                    "lon": lon,
                    "population": population
                })
    else:
        print("⚠️ Le fichier out2.json est vide ou non valide.")

# Charger les villes depuis cities.json
with open("cities.json", "r", encoding="utf-8") as f:
    cities = json.load(f)

added_csv = 0
added_json = 0
missing_population = 0
has_population = 0

for city in cities:
    pop_candidates = []
    # Population déjà présente dans cities.json
    if "population" in city and isinstance(city["population"], int):
        pop_candidates.append(city["population"])

    other_names = city.get("other_names", {})
    name_en = other_names.get("name:en", city.get("name", "")).strip().lower()
    location = city.get("location", None)
    if not name_en or not location or len(location) != 2:
        missing_population += 1
        continue

    lat, lon = location[1], location[0]
    found_csv = False
    found_json = False

    # Recherche dans le CSV
    for entry in populations_csv.get(name_en, []):
        if coords_are_close(lat, lon, entry["lat"], entry["lon"]):
            pop_candidates.append(entry["population"])
            found_csv = True
            break

    # Recherche dans le JSON secondaire
    for entry in populations_json2.get(name_en, []):
        if coords_are_close(lat, lon, entry["lat"], entry["lon"]):
            pop_candidates.append(entry["population"])
            found_json = True
            break

    if pop_candidates:
        max_pop = max(pop_candidates)
        if "population" not in city or city["population"] != max_pop:
            city["population"] = max_pop
        if found_csv:
            added_csv += 1
        if found_json:
            added_json += 1
        has_population += 1
    else:
        missing_population += 1

# Sauvegarder le résultat
with open("cities+pop.json", "w", encoding="utf-8") as f:
    json.dump(cities, f, ensure_ascii=False, indent=2)

# Affichage des statistiques
print(f"✅ Populations ajoutées depuis worldcities.csv : {added_csv}")
print(f"✅ Populations ajoutées depuis out2.json : {added_json}")
print(f"📊 Villes avec population : {has_population}")
print(f"⚠️ Villes sans population trouvée : {missing_population}")