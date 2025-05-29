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
  // Niveau de zoom par défaut
  const defaultZoom = 3;
  map = L.map('map', {
    minZoom: 2 // Limite de dézoom
  }).setView([20, 0], defaultZoom);
  window._leaflet_map_instance = map;
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}
initMap(); // Affiche la carte vide dès le début

function toAscii(str) {
  // Translitération russe
  function translittererRusse(texte) {
    const map = {
      "А": "A", "а": "a", "Б": "B", "б": "b",
      "В": "V", "в": "v", "Г": "G", "г": "g",
      "Д": "D", "д": "d", "Е": "E", "е": "e",
      "Ё": "E", "ё": "e", "Ж": "Zh", "ж": "zh",
      "З": "Z", "з": "z", "И": "I", "и": "i",
      "Й": "Y", "й": "y", "К": "K", "к": "k",
      "Л": "L", "л": "l", "М": "M", "м": "m",
      "Н": "N", "н": "n", "О": "O", "о": "o",
      "П": "P", "п": "p", "Р": "R", "р": "r",
      "С": "S", "с": "s", "Т": "T", "т": "t",
      "У": "U", "у": "u", "Ф": "F", "ф": "f",
      "Х": "Kh", "х": "kh", "Ц": "Ts", "ц": "ts",
      "Ч": "Ch", "ч": "ch", "Ш": "Sh", "ш": "sh",
      "Щ": "Shch", "щ": "shch", "Ы": "Y", "ы": "y",
      "Э": "E", "э": "e", "Ю": "Yu", "ю": "yu",
      "Я": "Ya", "я": "ya", "Ь": "", "ь": "", "Ъ": "", "ъ": ""
    };
    return texte.split('').map(char => map[char] ?? char).join('');
  }

  str = translittererRusse(str);
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ") // Remplace les tirets par des espaces
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase();
}

let villes = [];
let marqueurs = {};
let villesTrouvees = new Set();
let quizEnCours = false;
let nomAsciiToVilles = {}; // Déclaration en haut du fichier
let lastValidatedMarkers = []; // Ajout de cette ligne

function getVillesSelectionnees() {
  let data = window.villesData;
  const modePays = document.getElementById('modePays').value;

  if (modePays === 'one') {
    const code = document.getElementById('selectPays').value;
    data = data.filter(v => v.address && v.address.country_code === code);
  } else if (modePays === 'continent') {
    const continent = document.getElementById('selectContinent').value;
    const countriesByContinent = {
      afrique: [
        "dz", "ao", "bj", "bw", "bf", "bi", "cm", "cv", "cf", "td", "km", "cg",
        "cd", "ci", "dj", "eg", "gq", "er", "et", "ga", "gm", "gh", "gn", "gw",
        "ke", "ls", "lr", "ly", "mg", "mw", "ml", "mr", "mu", "ma", "mz", "na",
        "ne", "ng", "rw", "st", "sn", "sc", "sl", "so", "za", "ss", "sd", "tz",
        "tg", "tn", "ug", "zm", "zw", "eh", "sh", "sz"
      ],
      amerique_du_nord: [
        "ag", "bs", "bb", "bz", "ca", "cr", "cu", "dm", "do", "sv", "gd", "gt",
        "ht", "hn", "jm", "mx", "ni", "pa", "kn", "lc", "vc", "tt", "us", "ai", "bm", "gl", "ky", "ms"
      ],
      amerique_du_sud: [
        "ar", "bo", "br", "cl", "co", "ec", "gy", "py", "pe", "sr", "uy", "ve", "fk"
      ],
      antartique: ["gs"],
      asie: [
        "af", "am", "az", "bh", "bd", "bt", "bn", "kh", "cn", "cy", "ge", "in",
        "id", "ir", "iq", "il", "jp", "jo", "kz", "kw", "kg", "la", "lb", "my",
        "mv", "mn", "mm", "np", "om", "pk", "ph", "qa", "sa", "sg", "kr", "kp",
        "lk", "sy", "tw", "tj", "th", "tl", "tr", "tm", "ae", "uz", "vn", "ye", "ps", "ru"
      ],
      europe: [
        "al", "ad", "at", "by", "be", "ba", "bg", "hr", "cz", "dk", "ee", "fi",
        "fr", "de", "gr", "hu", "is", "ie", "it", "xk", "lv", "li", "lt", "lu",
        "mt", "md", "mc", "me", "nl", "mk", "no", "pl", "pt", "ro", "ru", "sm",
        "rs", "sk", "si", "es", "se", "ch", "ua", "gb", "va", "fo", "gg", "im",
        "je", "gi", "vg", "tr" // Turquie incluse pour le filtrage spécial
      ],
      oceanie: [
        "au", "fj", "ki", "mh", "fm", "nr", "nz", "pw", "pg", "ws", "sb", "to",
        "tv", "vu", "ck", "nu", "tk"
      ]
    };
    let codes = countriesByContinent[continent] || [];
    if (continent === 'autres') {
      const allKnown = Object.values(countriesByContinent).flat();
      codes = Array.from(new Set(window.villesData.map(v => v.address?.country_code)))
        .filter(code => !allKnown.includes(code));
    }
    // Filtrage spécial pour la Turquie en Europe
    if (continent === 'europe') {
      data = data.filter(v => {
        if (!v.address || !v.address.country_code) return false;
        if (v.address.country_code === 'tr') {
          // Turquie : ne garder que les villes européennes
          return (
            v.address.province === "Kırklareli" ||
            v.address.province === "Edirne" ||
            v.address.district === "Tekirdağ" ||
            v.address.province === "İstanbul"
          );
        } else if (v.address.country_code === 'ru') {
          // Russie : exclure les régions asiatiques
          return !(
            v.address.region === "Уральский федеральный округ" ||
            v.address.region === "Сибирский федеральный округ" ||
            v.address.region === "Дальневосточный федеральный округ"
          );
        } else {
          return codes.includes(v.address.country_code);
        }
      });
    } else if (continent === 'asie') {
      data = data.filter(v => {
        if (!v.address || !v.address.country_code) return false;
        if (v.address.country_code === 'tr') {
          // Turquie : exclure les villes européennes
          return !(
            v.address.province === "Kırklareli" ||
            v.address.province === "Edirne" ||
            v.address.district === "Tekirdağ" ||
            v.address.province === "İstanbul"
          );
        } else if (v.address.country_code === 'ru') {
          // Russie : inclure seulement les régions asiatiques
          return (
            v.address.region === "Уральский федеральный округ" ||
            v.address.region === "Сибирский федеральный округ" ||
            v.address.region === "Дальневосточный федеральный округ"
          );
        } else {
          return codes.includes(v.address.country_code);
        }
      });
    } else {
      data = data.filter(v => v.address && codes.includes(v.address.country_code));
    }
    console.log('Continent sélectionné :', continent);
    console.log('Codes ISO trouvés :', codes);
  }

  if (document.getElementById('modePopulation').checked) {
    const minPop = parseInt(document.getElementById('minPopulation').value, 10);
    return data.filter(v => v.population >= minPop);
  } else {
    const nbVilles = parseInt(document.getElementById('nbVilles').value, 10);
    return data
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

  // Cache aussi les sélecteurs de pays
  document.getElementById('modePays').value = 'all';
  document.getElementById('selectPays').style.display = 'none';

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
    const nomLower = nom.toLowerCase();
    const asciiNom = toAscii(nomLower);

    if (!nomLower || ville.location[1] === undefined || ville.location[0] === undefined) return;

    const marker = L.circleMarker([ville.location[1], ville.location[0]], {
      radius: 1,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.8,
      _villeNom: nomLower
    }).addTo(map);

    if (!nomAsciiToVilles[asciiNom]) nomAsciiToVilles[asciiNom] = [];
    nomAsciiToVilles[asciiNom].push(marker);

    // Prépare le contenu de la popup (affichage avec majuscule)
    let popupContent = nomLower.charAt(0).toUpperCase() + nomLower.slice(1);
    if (asciiNom !== nomLower) {
      popupContent = `${popupContent} <br><small>${asciiNom}</small>`;
    }
    marker.bindPopup(
      `<div class="popup-ville">${popupContent}</div>`,
      { className: 'popup-ville-container' }
    );

    // Popup au survol
    marker.on('mouseover', function() {
      if (villesTrouvees.has(marker)) {
        let popupContent = nomLower.charAt(0).toUpperCase() + nomLower.slice(1);
        if (asciiNom !== nomLower) {
          popupContent = `${popupContent} <br><small>${asciiNom}</small>`;
        }
        marker.bindPopup(
          `<div class="popup-ville">${popupContent}</div>`,
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
    const saisie = toAscii(input.value.trim().toLowerCase());
    const markers = nomAsciiToVilles[saisie];
  

    if (markers && markers.some(m => !villesTrouvees.has(m))) {
      // Remet les anciens en vert
      lastValidatedMarkers.forEach(marker => {
        marker.setStyle({ color: 'green', fillColor: 'green', radius: 2 });
      });
      lastValidatedMarkers = [];

      // Mets les nouveaux en jaune
      markers.forEach(marker => {
        if (!villesTrouvees.has(marker)) {
          marker.setStyle({ color: 'yellow', fillColor: "yellow", radius: 2 , fillOpacity: 1});
          villesTrouvees.add(marker);
          lastValidatedMarkers.push(marker);
          const villeNom = marker.options._villeNom || '';
          const asciiNom = toAscii(villeNom);
          let popupContent = villeNom;
          if (asciiNom !== villeNom.toLowerCase()) {
            popupContent = `${villeNom} <br><small>${asciiNom}</small>`;
          }
          marker.bindPopup(
            `<div class="popup-ville">${popupContent}</div>`,
            { className: 'popup-ville-container' }
          );
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
  document.getElementById('modePays').style.display = '';
  document.getElementById('selectPays').style.display = '';

  // Sélectionne "population minimale" par défaut
  document.getElementById('modePopulation').checked = true;
  document.getElementById('modeNbVilles').checked = false;
  document.getElementById('minPopulation').style.display = '';
  document.getElementById('nbVilles').style.display = 'none';

  // Sélectionne "Tous les pays" par défaut et masque la liste
  document.getElementById('modePays').value = 'all';
  document.getElementById('selectPays').style.display = 'none';

  // Regénérer la liste des pays
  const select = document.getElementById('selectPays');
  select.innerHTML = '';
  getPaysList().forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = countryCodeToName[code] || code.toUpperCase();
    select.appendChild(opt);
  });

  initMap();
});

// Bouton "Montrer les villes"
document.getElementById('showQuizBtn').addEventListener('click', () => {
  quizEnCours = false; // On n'est pas dans le quiz
  const villesToShow = getVillesSelectionnees();

  initMap();

  // --- Correction pour "Montrer les villes" ---
  villesToShow.forEach(ville => {
    let nom = (ville["name:fr"] || ville["name:en"] || ville.name || "");
    if (!nom || ville.location[1] === undefined || ville.location[0] === undefined) return;
    const marker = L.circleMarker([ville.location[1], ville.location[0]], {
      radius: 1,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 1
    }).addTo(map);

    const asciiNom = toAscii(nom).toLowerCase();
    const nomMaj = nom.charAt(0).toUpperCase() + nom.slice(1);
    let popupContent;
    if (asciiNom !== nom.toLowerCase()) {
      popupContent = `${nomMaj} <br><small>${asciiNom}</small>`;
    } else {
      popupContent = nomMaj;
    }
    marker.bindPopup(
      `<div class="popup-ville">${popupContent}</div>`,
      { className: 'popup-ville-container' }
    );
    marker.on('mouseover', function() { marker.openPopup(); });
    marker.on('mouseout', function() { marker.closePopup(); });
  });

  document.getElementById('villeInput').style.display = 'none';
  document.getElementById('restartQuizBtn').style.display = 'none';
  document.getElementById('backToHomeBtn').style.display = 'none';

  // Affiche le nombre de villes
  document.getElementById('compteur').textContent = `${villesToShow.length} villes affichées`;
});

// Bouton "Mettre fin au quiz"
document.getElementById('endQuizBtn').addEventListener('click', () => {
  // Cache l'input et les boutons quiz
  document.getElementById('villeInput').style.display = 'none';
  document.getElementById('restartQuizBtn').style.display = ''; // <-- Affiche le bouton recommencer
  document.getElementById('backToHomeBtn').style.display = '';
  document.getElementById('endQuizBtn').style.display = 'none';

  // --- Correction pour "Mettre fin au quiz" ---
  Object.values(nomAsciiToVilles).flat().forEach(marker => {
    if (marker.options && marker.options._villeNom) {
      const villeNom = marker.options._villeNom;
      const villeNomMaj = villeNom.charAt(0).toUpperCase() + villeNom.slice(1);
      const asciiNom = toAscii(villeNom);
      let popupContent;
      if (asciiNom !== villeNom.toLowerCase()) {
        popupContent = `${villeNomMaj} <br><small>${asciiNom}</small>`;
      } else {
        popupContent = villeNomMaj;
      }
      marker.bindPopup(
        `<div class="popup-ville">${popupContent}</div>`,
        { className: 'popup-ville-container' }
      );
      marker.on('mouseover', function() { marker.openPopup(); });
      marker.on('mouseout', function() { marker.closePopup(); });
    }
  });

  document.getElementById('compteur').textContent = '';
});

// Dictionnaire code pays -> nom pays
let countryCodeToName = {ad: "Andorre",  ae: "Émirats arabes unis",  af: "Afghanistan",  ag: "Antigua-et-Barbuda",  ai: "Anguilla",  al: "Albanie",  am: "Arménie",  ao: "Angola",  ar: "Argentine",at: "Autriche",  au: "Australie",  az: "Azerbaïdjan",  ba: "Bosnie-Herzégovine",  bb: "Barbade",  bd: "Bangladesh",  be: "Belgique",  bf: "Burkina Faso",  bg: "Bulgarie",  bh: "Bahreïn",  bi: "Burundi",  bj: "Bénin",  bm: "Bermudes",  bn: "Brunei",  bo: "Bolivie",  br: "Brésil",  bs: "Bahamas",  bt: "Bhoutan",  bw: "Botswana",  by: "Biélorussie",  bz: "Belize",  ca: "Canada",  cd: "République démocratique du Congo",  cf: "République centrafricaine",  cg: "République du Congo",  ch: "Suisse",  ci: "Côte d'Ivoire",  ck: "Îles Cook",  cl: "Chili",  cm: "Cameroun",  cn: "Chine",  co: "Colombie",  cr: "Costa Rica",  cu: "Cuba",  cv: "Cap-Vert",  cy: "Chypre",  cz: "Tchéquie",  de: "Allemagne",  dj: "Djibouti",  dk: "Danemark",  dm: "Dominique",  do: "République dominicaine",  dz: "Algérie",  ec: "Équateur",  ee: "Estonie",  eg: "Égypte",  eh: "Sahara occidental",  er: "Érythrée",  es: "Espagne",  et: "Éthiopie",  fi: "Finlande",  fj: "Fidji",  fm: "Micronésie",  fo: "Îles Féroé",  fr: "France",  ga: "Gabon",  gb: "Royaume-Uni",  gd: "Grenade",  ge: "Géorgie",  gg: "Guernesey",  gh: "Ghana",  gi: "Gibraltar",  gl: "Groenland",  gm: "Gambie",  gn: "Guinée",  gq: "Guinée équatoriale",  gr: "Grèce",  gt: "Guatemala",  gw: "Guinée-Bissau",  gy: "Guyana", hn: "Honduras",  hr: "Croatie",  ht: "Haïti",  hu: "Hongrie",  id: "Indonésie",  ie: "Irlande",  il: "Israël",  im: "Île de Man",  in: "Inde",  iq: "Irak",  ir: "Iran",  is: "Islande",  it: "Italie",  je: "Jersey",  jm: "Jamaïque",  jo: "Jordanie",  jp: "Japon",  ke: "Kenya",  kg: "Kirghizistan",  kh: "Cambodge",  ki: "Kiribati",  km: "Comores",  kn: "Saint-Christophe-et-Niévès",  kp: "Corée du Nord",  kr: "Corée du Sud",  kw: "Koweït",  ky: "Îles Caïmans",  kz: "Kazakhstan",  la: "Laos",  lb: "Liban",  lc: "Sainte-Lucie",  li: "Liechtenstein",  lk: "Sri Lanka",  lr: "Libéria",  ls: "Lesotho",  lt: "Lituanie",  lu: "Luxembourg",  lv: "Lettonie",  ly: "Libye",  ma: "Maroc",  mc: "Monaco",  md: "Moldavie",  me: "Monténégro",  mg: "Madagascar",  mh: "Îles Marshall",  mk: "Macédoine du Nord",  ml: "Mali",  mm: "Myanmar",  mn: "Mongolie",  ms: "Montserrat",  mt: "Malte",  mu: "Maurice",  mv: "Maldives",  mw: "Malawi",  mx: "Mexique",  my: "Malaisie",  mz: "Mozambique",  na: "Namibie",  ng: "Nigéria",  ni: "Nicaragua",  nl: "Pays-Bas",  no: "Norvège",  np: "Népal",  nr: "Nauru",  nu: "Niue",  nz: "Nouvelle-Zélande",  om: "Oman",  pa: "Panama",  pe: "Pérou",  pg: "Papouasie-Nouvelle-Guinée",  ph: "Philippines",  pk: "Pakistan",  pl: "Pologne",  ps: "Palestine",  pt: "Portugal",  pw: "Palaos",  py: "Paraguay",  qa: "Qatar",  ro: "Roumanie",  rs: "Serbie",  ru: "Russie",  rw: "Rwanda",  sa: "Arabie saoudite",  sb: "Îles Salomon",  sc: "Seychelles",  sd: "Soudan",  se: "Suède",  sg: "Singapour",  sh: "Sainte-Hélène",  si: "Slovénie",  sk: "Slovaquie",  sm: "Saint-Marin",  sn: "Sénégal",  so: "Somalie",  sr: "Suriname",  ss: "Soudan du Sud",  st: "Sao Tomé-et-Principe",  sv: "Salvador",  sy: "Syrie",  sz: "Eswatini",  td: "Tchad",  tg: "Togo",  th: "Thaïlande",  tj: "Tadjikistan",  tk: "Tokelau",  tl: "Timor oriental",  tm: "Turkménistan",  tn: "Tunisie",  to: "Tonga",  tr: "Turquie",  tt: "Trinité-et-Tobago",  tv: "Tuvalu",  tz: "Tanzanie",  ua: "Ukraine",  ug: "Ouganda",  us: "États-Unis",  uy: "Uruguay",  uz: "Ouzbékistan",  vc: "Saint-Vincent-et-les-Grenadines",  ve: "Venezuela",  vg: "Îles Vierges britanniques",  vn: "Viêt Nam",  vu: "Vanuatu",  ws: "Samoa",  ye: "Yémen",  za: "Afrique du Sud",  zm: "Zambie",  zw: "Zimbabwe",  xk: "Kosovo"};

// Génère la liste des pays uniques à partir de la base de données
function getPaysList() {
  const codes = new Set();
  window.villesData.forEach(ville => {
    if (ville.address && ville.address.country_code) {
      codes.add(ville.address.country_code);
    }
  });

  // Récupère le continent sélectionné
  const continent = document.getElementById('selectContinent')?.value || 'all';
  console.log('Continent sélectionné :', continent);

  // Liste des codes ISO par continent
  const countriesByContinent = {
    afrique: [
      "dz", "ao", "bj", "bw", "bf", "bi", "cm", "cv", "cf", "td", "km", "cg",
      "cd", "ci", "dj", "eg", "gq", "er", "et", "ga", "gm", "gh", "gn", "gw",
      "ke", "ls", "lr", "ly", "mg", "mw", "ml", "mr", "mu", "ma", "mz", "na",
      "ne", "ng", "rw", "st", "sn", "sc", "sl", "so", "za", "ss", "sd", "tz",
      "tg", "tn", "ug", "zm", "zw"
    ],
    amerique_du_nord: [
      "ag", "bs", "bb", "bz", "ca", "cr", "cu", "dm", "do", "sv", "gd", "gt",
      "ht", "hn", "jm", "mx", "ni", "pa", "kn", "lc", "vc", "tt", "us"
    ],
    amerique_du_sud: [
      "ar", "bo", "br", "cl", "co", "ec", "gy", "py", "pe", "sr", "uy", "ve"
    ],
    asie: [
      "af", "am", "az", "bh", "bd", "bt", "bn", "kh", "cn", "cy", "ge", "in",
      "id", "ir", "iq", "il", "jp", "jo", "kz", "kw", "kg", "la", "lb", "my",
      "mv", "mn", "mm", "np", "om", "pk", "ph", "qa", "sa", "sg", "kr", "kp",
      "lk", "sy", "tw", "tj", "th", "tl", "tr", "tm", "ae", "uz", "vn", "ye"
    ],
    europe: [
      "al", "ad", "at", "by", "be", "ba", "bg", "hr", "cz", "dk", "ee", "fi",
      "fr", "de", "gr", "hu", "is", "ie", "it", "xk", "lv", "li", "lt", "lu",
      "mt", "md", "mc", "me", "nl", "mk", "no", "pl", "pt", "ro", "ru", "sm",
      "rs", "sk", "si", "es", "se", "ch", "ua", "gb", "va"
    ],
    oceanie: [
      "au", "fj", "ki", "mh", "fm", "nr", "nz", "pw", "pg", "ws", "sb", "to",
      "tv", "vu"
    ]
  };

  let filteredCodes = Array.from(codes);

  if (continent && continent !== 'all') {
    let continentCodes = countriesByContinent[continent] || [];
    if (continent === 'autres') {
      const allKnown = Object.values(countriesByContinent).flat();
      continentCodes = filteredCodes.filter(code => !allKnown.includes(code));
    } else {
      continentCodes = continentCodes.filter(code => filteredCodes.includes(code));
    }
    filteredCodes = continentCodes;
    console.log("Codes ISO trouvés pour le continent", continent, ":", filteredCodes);
  }

  // Trie par nom de pays selon le dictionnaire fourni
  return filteredCodes.sort((a, b) => {
    const na = countryCodeToName[a] || a.toUpperCase();
    const nb = countryCodeToName[b] || b.toUpperCase();
    return na.localeCompare(nb);
  });
}

// Affiche/masque le menu déroulant des pays et des continents selon le mode choisi
document.getElementById('modePays').addEventListener('change', function() {
  const selectPays = document.getElementById('selectPays');
  const selectContinent = document.getElementById('selectContinent');
  if (this.value === 'one') {
    // Affiche la liste des pays (tous), masque la liste des continents
    selectPays.innerHTML = '';
    // Affiche TOUS les pays, pas de filtre continent ici !
    Object.keys(countryCodeToName).sort().forEach(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = countryCodeToName[code] || code.toUpperCase();
      selectPays.appendChild(opt);
    });
    selectPays.style.display = '';
    selectContinent.style.display = 'none';
  } else if (this.value === 'continent') {
    // Affiche la liste des continents, masque la liste des pays
    selectPays.style.display = 'none';
    selectContinent.style.display = '';
  } else {
    // Masque les deux listes si "tous les pays" est sélectionné
    selectPays.style.display = 'none';
    selectContinent.style.display = 'none';
  }
});

document.getElementById('selectContinent').style.display = 'none';