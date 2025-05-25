// Initialisation de la carte centrée sur le monde
const map = L.map('map').setView([20, 0], 2);

// Ajout du fond de carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 6,
  minZoom: 1
}).addTo(map);

// Villes à afficher
const villes = [
  { nom: 'Paris', coords: [48.8566, 2.3522] },
  { nom: 'Tokyo', coords: [35.6762, 139.6503] },
  { nom: 'Le Caire', coords: [30.0444, 31.2357] }
];

// Affichage des marqueurs
villes.forEach(ville => {
  L.circleMarker(ville.coords, {
    radius: 6,
    color: 'red',
    fillColor: 'red',
    fillOpacity: 0.8
  })
  .addTo(map)
  .bindPopup(ville.nom);
});
