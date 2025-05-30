import json
import csv
import math
from tqdm import tqdm

# === 1. Ajout des populations ===

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

# Charger les villes depuis cities.json
with open("cities.json", "r", encoding="utf-8") as f:
    cities = json.load(f)

print("Ajout des populations...")
for city in tqdm(cities, desc="Population"):
    pop_candidates = []

    other_names = city.get("other_names", {})
    name_en = other_names.get("name:en", city.get("name", "")).strip().lower()
    location = city.get("location", None)
    if not name_en or not location or len(location) != 2:
        continue

    lat, lon = location[1], location[0]

    # Recherche dans le CSV
    for entry in populations_csv.get(name_en, []):
        if coords_are_close(lat, lon, entry["lat"], entry["lon"]):
            pop_candidates.append(entry["population"])
            break

    # Recherche dans le JSON secondaire
    for entry in populations_json2.get(name_en, []):
        if coords_are_close(lat, lon, entry["lat"], entry["lon"]):
            pop_candidates.append(entry["population"])
            break

    if pop_candidates:
        max_pop = max(pop_candidates)
        # On ne prend PAS en compte la population déjà présente dans city
        city["population"] = max_pop

# === 2. Suppression des doublons optimisée ===

def coords_are_close_dup(loc1, loc2, tol=0.01):
    if not loc1 or not loc2 or len(loc1) != 2 or len(loc2) != 2:
        return False
    lat1, lon1 = loc1[1], loc1[0]
    lat2, lon2 = loc2[1], loc2[0]
    return abs(lat1 - lat2) < tol and abs(lon1 - lon2) < tol

def remove_duplicates(villes):
    unique = []
    seen_coords = set()
    seen_name_pop = set()
    seen_display_name_pop = set()
    name_index = {}
    display_name_index = {}
    coord_index = {}

    def rounded_loc(loc, digits=3):
        return (round(loc[0], digits), round(loc[1], digits))

    print("Suppression des doublons...")
    for ville in tqdm(villes, desc="Doublons"):
        name = ville.get("name", "").strip().lower()
        display_name = ville.get("display_name", "").strip().lower()
        loc = tuple(ville.get("location", []))
        pop = ville.get("population", None)
        if not loc or len(loc) != 2:
            continue

        # 1. Doublon exact sur les coordonnées
        if loc in seen_coords:
            continue

        # 2. Doublon exact sur (nom, population)
        if (name, pop) in seen_name_pop:
            continue

        # 3. Doublon exact sur (display_name, population)
        if (display_name, pop) in seen_display_name_pop:
            continue

        # 4. Doublon sur nom et coordonnées proches
        is_duplicate = False
        loc_r = rounded_loc(loc)
        for v2 in name_index.get(name, []):
            loc2 = tuple(v2.get("location", []))
            if coords_are_close_dup(loc, loc2, tol=0.1):
                is_duplicate = True
                break
        # 5. Doublon sur display_name et coordonnées proches
        if not is_duplicate:
            for v2 in display_name_index.get(display_name, []):
                loc2 = tuple(v2.get("location", []))
                if coords_are_close_dup(loc, loc2, tol=0.1):
                    is_duplicate = True
                    break
        # 6. Doublon sur coordonnées proches (index par arrondi)
        if not is_duplicate:
            for v2 in coord_index.get(loc_r, []):
                loc2 = tuple(v2.get("location", []))
                if coords_are_close_dup(loc, loc2, tol=0.01):
                    is_duplicate = True
                    break

        if not is_duplicate:
            unique.append(ville)
            seen_coords.add(loc)
            seen_name_pop.add((name, pop))
            seen_display_name_pop.add((display_name, pop))
            name_index.setdefault(name, []).append(ville)
            display_name_index.setdefault(display_name, []).append(ville)
            coord_index.setdefault(loc_r, []).append(ville)
    return unique

cities = remove_duplicates(cities)

# === 3. Nettoyage des champs ===

def clean_city(city):
    # On ignore la ville si elle n’a pas de population
    if 'population' not in city:
        return None

    # Copie les champs sauf ceux à supprimer
    cleaned = {
        key: value
        for key, value in city.items()
        if key not in ['display_name', 'osm_type', 'osm_id', 'type', 'bbox', 'other_names']
    }

    # Si name:fr ou name:en existe dans other_names, on les garde à part
    other_names = city.get('other_names', {})
    if isinstance(other_names, dict):
        name_fr = other_names.get('name:fr')
        if name_fr:
            cleaned['name:fr'] = name_fr
        name_en = other_names.get('name:en')
        if name_en:
            cleaned['name:en'] = name_en

    return cleaned

final_data = []
print("Nettoyage des champs...")
for city in tqdm(cities, desc="Nettoyage"):
    result = clean_city(city)
    if result:
        final_data.append(result)

# Écriture du fichier final
with open("cities.js", "w", encoding="utf-8") as f:
    f.write("window.villesData = ")
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"[✔] Traitement terminé : cities.js")