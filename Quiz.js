// Affiche/masque les bons inputs selon le mode choisi
document.getElementById('modePopulation').addEventListener('change', () => {
  document.getElementById('minPopulation').style.display = '';
  document.getElementById('nbVilles').style.display = 'none';
});
document.getElementById('modeNbVilles').addEventListener('change', () => {
  document.getElementById('minPopulation').style.display = 'none';
  document.getElementById('nbVilles').style.display = '';
});

// Initialisation de la carte vide au chargement
let map;
function initMap() {
  if (window._leaflet_map_instance) {
    window._leaflet_map_instance.remove();
    document.getElementById('map').innerHTML = "";
  }
  map = L.map('map').setView([20, 0], 3);
  window._leaflet_map_instance = map;
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}
initMap(); // Affiche la carte vide dès le début

function toAscii(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase();
}

let villes = [];
let marqueurs = {};
let villesTrouvees = new Set();
let quizEnCours = false;
let nomAsciiToVilles = {}; // Déclaration en haut du fichier

function getVillesSelectionnees() {
  if (document.getElementById('modePopulation').checked) {
    const minPop = parseInt(document.getElementById('minPopulation').value, 10);
    return window.villesData.filter(v => v.population >= minPop);
  } else {
    const nbVilles = parseInt(document.getElementById('nbVilles').value, 10);
    return window.villesData
      .slice()
      .sort((a, b) => b.population - a.population)
      .slice(0, nbVilles);
  }
}

// === Démarrage du quiz ===
document.getElementById('startQuizBtn').addEventListener('click', () => {
  villes = getVillesSelectionnees();

  // Affiche le quiz et cache les contrôles de démarrage
  document.getElementById('villeInput').style.display = '';
  document.getElementById('restartQuizBtn').style.display = '';
  document.getElementById('backToHomeBtn').style.display = '';
  document.getElementById('compteur').style.display = '';

  // Cache les éléments de démarrage
  document.getElementById('minPopulation').style.display = 'none';
  document.getElementById('nbVilles').style.display = 'none';
  document.getElementById('startQuizBtn').style.display = 'none';
  document.getElementById('showQuizBtn').style.display = 'none';
  document.getElementById('labelPopulation').style.display = 'none';
  document.getElementById('labelNbVilles').style.display = 'none';
  document.getElementById('modePopulation').style.display = 'none';
  document.getElementById('modeNbVilles').style.display = 'none';
  document.getElementById('endQuizBtn').style.display = '';

  demarrerQuiz();
});
function demarrerQuiz() {
  quizEnCours = true;
  initMap();
  marqueurs = {};
  villesTrouvees = new Set();
  nomAsciiToVilles = {}; // Réinitialisation à chaque nouveau quiz

  // Ajoute les marqueurs pour chaque ville
  villes.forEach(ville => {
    let nom = (ville["name:fr"] || ville["name:en"] || ville.name || "");
    if (!nom || ville.location[1] === undefined || ville.location[0] === undefined) return;

    const nomAscii = toAscii(nom);

    const marker = L.circleMarker([ville.location[1], ville.location[0]], {
      radius: 1,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.8,
      _villeNom: nom // <-- ajoute cette ligne
    }).addTo(map);

    // On stocke tous les marqueurs pour ce nom ASCII
    if (!nomAsciiToVilles[nomAscii]) nomAsciiToVilles[nomAscii] = [];
    nomAsciiToVilles[nomAscii].push(marker);

    // Affiche le nom au survol SEULEMENT si la ville est validée
    marker.on('mouseover', function() {
      if (villesTrouvees.has(marker)) {
        marker.bindPopup(
          `<div class="popup-ville">${nom} <br><small>${toAscii(nom)}</small></div>`,
          { className: 'popup-ville-container' }
        );
        marker.openPopup();
      }
    });
    marker.on('mouseout', function() { marker.closePopup(); });
  });

  // Gestion de la saisie utilisateur
  const input = document.getElementById('villeInput');
  input.value = '';
  input.style.display = '';
  document.getElementById('restartQuizBtn').style.display = '';
  document.getElementById('backToHomeBtn').style.display = '';
  updateCompteur();

  input.oninput = function () {
    const saisie = toAscii(input.value.trim());
    const markers = nomAsciiToVilles[saisie];
    if (markers && markers.some(m => !villesTrouvees.has(m))) {
      markers.forEach(marker => {
        if (!villesTrouvees.has(marker)) {
          marker.setStyle({ color: 'green', fillColor: 'green', radius: 5 });
          villesTrouvees.add(marker);
          marker.bindPopup(
            `<div class="popup-ville">${nom} <br><small>${toAscii(nom)}</small></div>`,
            { className: 'popup-ville-container' }
          );
          marker.openPopup();
        }
      });
      updateCompteur();
      input.style.backgroundColor = "#b6fcb6";
      setTimeout(() => { input.style.backgroundColor = ""; }, 100);
      input.value = '';
    }
  };
}
function updateCompteur() {
  const compteur = document.getElementById('compteur');
  compteur.textContent = `${villesTrouvees.size} / ${villes.length} villes trouvées`;
}

// Bouton "Recommencer le quiz"
document.getElementById('restartQuizBtn').addEventListener('click', () => {
  document.getElementById('endQuizBtn').style.display = '';
  villesTrouvees = new Set();
  demarrerQuiz(); // Relance le quiz avec les mêmes villes et paramètres
});

// Bouton "Faire un autre quiz"
document.getElementById('backToHomeBtn').addEventListener('click', () => {
  document.getElementById('endQuizBtn').style.display = 'none';
  villesTrouvees = new Set();
  marqueurs = {};
  document.getElementById('villeInput').style.display = 'none';
  document.getElementById('restartQuizBtn').style.display = 'none';
  document.getElementById('backToHomeBtn').style.display = 'none';
  document.getElementById('compteur').textContent = '';
  // Réaffiche les éléments de démarrage
  document.getElementById('minPopulation').style.display = '';
  document.getElementById('nbVilles').style.display = 'none';
  document.getElementById('startQuizBtn').style.display = '';
  document.getElementById('showQuizBtn').style.display = '';
  document.getElementById('labelPopulation').style.display = '';
  document.getElementById('labelNbVilles').style.display = '';
  document.getElementById('modePopulation').style.display = '';
  document.getElementById('modeNbVilles').style.display = '';
  initMap();
});

// Bouton "Montrer les villes"
document.getElementById('showQuizBtn').addEventListener('click', () => {
  quizEnCours = false; // On n'est pas dans le quiz
  const villesToShow = getVillesSelectionnees();

  initMap();

  villesToShow.forEach(ville => {
    let nom = (ville["name:fr"] || ville["name:en"] || ville.name || "");
    if (!nom || ville.location[1] === undefined || ville.location[0] === undefined) return;
    const marker = L.circleMarker([ville.location[1], ville.location[0]], {
      radius: 3,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.5
    }).addTo(map);

    // Toujours afficher le nom au survol si pas de quiz en cours
    marker.bindPopup(nom);
    marker.on('mouseover', function() { marker.openPopup(); });
    marker.on('mouseout', function() { marker.closePopup(); });
  });

  document.getElementById('villeInput').style.display = 'none';
  document.getElementById('restartQuizBtn').style.display = 'none';
  document.getElementById('backToHomeBtn').style.display = 'none';
  document.getElementById('compteur').textContent = '';
});

// Bouton "Mettre fin au quiz"
document.getElementById('endQuizBtn').addEventListener('click', () => {
  // Cache l'input et les boutons quiz
  document.getElementById('villeInput').style.display = 'none';
  document.getElementById('restartQuizBtn').style.display = ''; // <-- Affiche le bouton recommencer
  document.getElementById('backToHomeBtn').style.display = '';
  document.getElementById('endQuizBtn').style.display = 'none';

  Object.values(nomAsciiToVilles).flat().forEach(marker => {
    if (marker.options && marker.options._villeNom) {
      marker.bindPopup(marker.options._villeNom);
      marker.on('mouseover', function() { marker.openPopup(); });
      marker.on('mouseout', function() { marker.closePopup(); });
    }
  });

  document.getElementById('compteur').textContent = '';
});