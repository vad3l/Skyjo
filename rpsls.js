/********************************************************************
 *   Module implémentant un jeu de Rock-Paper-Scissors-Lizard-Spock
 ********************************************************************/
 
 // défis en cours
var defis = {};         // { id -> { adversaire1 => choix1, adversaire2 => choix2 }, ... }
// scores des participants 
var scores = {};        // { id -> number, ... }


var beats = { 
    "rock": { "scissors": "crushes", "lizard": "crushes" }, 
    "lizard": { "spock": "poisons", "paper": "eats" },
    "scissors": { "lizard": "decapitate", "paper" : "cut" },
    "spock": { "scissors" : "smashes", "rock": "vaporizes" },
    "paper": { "rock": "covers", "spock": "disproves" }
};


/**
 *  Enregistre un défi ou résoud une bataille entre deux joueurs.
 *  @param  string  joueur1     le pseudo du premier joueur
 *  @param  string  joueur2     le pseudo du second joueur
 *  @param  string  choixJ1     le choix du joueur 1
 */
function defier(joueur1, joueur2, choixJ1) {
    if (! defis[joueur1]) {
        return { status: -1, message: `Le joueur ${joueur1} n'existe pas.` };   
    }
    if (! defis[joueur2]) {
        return { status: -1, message: `Le joueur ${joueur2} n'existe pas.` };   
    }
    if (! beats[choixJ1]) {
        return { status: -1, message: `Le choix du joueur (${choixJ1}) est incorrect.` };   
    }
    // si le joueur1 était défié par joueur2
    if (defis[joueur2][joueur1]) {
        return { status: 0, resultat: bataille(joueur2, defis[joueur2][joueur1], joueur1, choixJ1) };
    }
    // si on se défie soi-même 
    if (joueur1 == joueur2) {
        return { status: -1, message: "Impossible de se défier soi-même." };   
    }
    // si le joueur1 est déjà en train de défier le joueur2
    if (defis[joueur1][joueur2]) {
        return { status: -2, message: `Un défi à ${joueur2} est déjà en attente.`};
    }
    defis[joueur1][joueur2] = choixJ1;
    return { status: 1, message: `Défi lancé à ${joueur2}.` }; 
}


/**
 *  Ajoute l'utilisateur à l'ensemble     
 */
function ajouter(pseudo) {
    if (defis[pseudo]) {
        return false;   
    }
    defis[pseudo] = {};
    scores[pseudo] = 0;
    return true;
}

/**
 *  Supprime l'utilisateur passé en paramètre et efface ses scores et ses défis (lancés ou en attente). 
 */
function supprimer(pseudo) {
    // suppression des lanceurs de défis
    delete defis[pseudo];
    // suppression des scores
    delete scores[pseudo];
    // suppression 
    for (let p in defis) {
        delete defis[p][pseudo];   
    }
}

/**
 *  Renvoie un chaine JSON 
 */
function scoresJSON() {
    return JSON.stringify(scores);   
}


/**
 *  Compare les mains, détermine le vainqueur, le perdant, supprime le défi (chez joueur1), met à jour les scores
 *  et renvoie un objet informant du résultat. 
 *  @return 
 */
function bataille(joueur1, choix1, joueur2, choix2) {
    // cas d'un match nul
    if (choix1 == choix2) {
        var matchNul = `:${choix1}: vs. :${choix2}: - égalité`;
        // supprime le défi chez joueur1
        delete defis[joueur1][joueur2];
        return { vainqueur: null, perdant: null, message: matchNul };
    }
    
    // compare les mains et détermine le vainqueur et le perdant
    var vainqueur = (beats[choix1][choix2]) ? joueur1 : joueur2;
    var perdant = (vainqueur == joueur1) ? joueur2 : joueur1;
    // notifie le vainqueur et le perdant
    var resume = (beats[choix1][choix2]) 
                ? `:${choix1}: ${beats[choix1][choix2]} :${choix2}:` 
                : `:${choix2}: ${beats[choix2][choix1]} :${choix1}:`;
    // supprime le défi chez joueur1
    delete defis[joueur1][joueur2];
    // met à jour le score 
    scores[vainqueur]++;
    return { vainqueur: vainqueur, perdant: perdant, message: resume };
}

// Définition des fonctions exportées
module.exports = { ajouter, supprimer, defier, scoresJSON };
