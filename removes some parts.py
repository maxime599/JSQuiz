import json

# Fichiers d'entrée et de sortie
input_file = 'cities_sans_doublons.json'
output_file = 'cities.js'

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

# Lecture du fichier JSON
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Nettoyage des villes
cleaned_data = []
for city in data:
    result = clean_city(city)
    if result:
        cleaned_data.append(result)

# Écriture du fichier propre
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(cleaned_data, f, ensure_ascii=False, indent=2)

print(f"[✔] Nettoyage terminé : {output_file}")
