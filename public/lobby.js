/****
 * Corrigé du TP1 - Picross
 * @author Fred Dadeau (frederic.dadeau@univ-fcomte.fr)
 */

/**
 * Classe représentant une grille.
 */
 class Grid {

    /**
     * Constructeur de classe
     * @param {number} l nombre de lignes 
     * @param {number} c nombre de colonnes
     */
    constructor(l, c) {
        // initialisation d'un tableau de l lignes x c colonnes remplis de 0 
        this.matrix = Array(l).fill(null).map(_e => Array(c).fill(0));        
        this.cols = c;
        this.lines = l;
    }

    /**
     * Inverse la valeur d'une case de la grille.
     * @param {number} l la ligne de la case à inverser
     * @param {number} c la colonne de la case à inverser
     */
    toggle(l, c) {
        this.matrix[l][c] = 1 - this.matrix[l][c];
    }

    /**
     * Calcule une description de la ligne.
     * @param {number} l le numéro de ligne à considérer
     * @returns {Array} un tableau contenant la description de la ligne
     */
    getLineDescription(l) {
        let r = [];
        let n = 0;
        for (let c=0; c < this.matrix[l].length; c++) {
            if (this.matrix[l][c] === 1) {
                n++;
            }
            else if (n > 0) {   // fin d'une série
                r.push(n);
                n = 0;
            }
        }
        if (n > 0) {    // cas où on termine sur une case noire
            r.push(n);
        }
        return r;
    }

   /**
     * Calcule une description de la colonne.
     * @param {number} l le numéro de colonne à considérer
     * @returns {Array} un tableau contenant la description de la colonne
     */
    getColumnDescription(c) {
        let r = [];
        let n = 0;
        for (let l=0; l < this.matrix.length; l++) {
            if (this.matrix[l][c] === 1) {
                n++;
            }
            else if (n > 0) {
                r.push(n);
                n = 0;
            }
        }
        if (n > 0) {
            r.push(n);
        }
        return r;
    }

    /**
     *  Exporte la description de la grille sous la forme d'une chaîne JSON
     *  où les caractères "[", "]", et "," sont remplacés par "a", "b" et "c". 
     */
    exportToString() {
        let descL = [];
        for (let i=0; i < this.matrix.length; i++) {
            descL.push(this.getLineDescription(i));
        }
        let descC = []; 
        for (let i=0; i < this.matrix[0].length; i++) {
            descC.push(this.getColumnDescription(i));
        }
        let ret = JSON.stringify([descL, descC]);
        ret = ret.replaceAll("[","a");
        ret = ret.replaceAll("]","b");
        ret = ret.replaceAll(",","c");
        return ret;
    }   

}


// fonction déclenchée quand le DOM a été chargé
document.addEventListener("DOMContentLoaded", function() {

    // récupération de la querystring
    let queryString = window.location.search.substring(1);
    if(queryString.length == 0) {
        return;
    }
    
    let query = parseQueryString(queryString);
    let grid = null;
    let description = null;

    if (query.edit !== undefined && query.lines && query.cols) {
        document.body.innerHTML = getHTMLSkeleton();
        if (Number(query.lines) < 1) {
            return;
        }
        if (Number(query.cols) < 1) {
            return;
        }
        grid = new Grid(Number(query.lines),Number(query.cols));
        initGrid();
        document.querySelector(".grid tbody").addEventListener("click", clickWhenEditing);
        showShareLink();
    }
    else if (query.play !== undefined) {
        description = importFromString(query.play);
        if (!description) {
            document.querySelector("form textarea").innerHTML = query.play;
            document.querySelector("#pError").innerHTML = "Code invalide.";
            return;
        }
        grid = new Grid(description[0].length, description[1].length);
        document.body.innerHTML = getHTMLSkeleton();
        initGrid();
        document.querySelector(".grid tbody").addEventListener("click", clickWhenPlaying);
        showDescription(description);
    }
    else return;


    /**************************************************************
     *     Fonctions utilitaires pour initialiser les données
     **************************************************************/

    /**
     * Transforme une querystring en objet.
     * @param {string} qs la query string param1=val1&param2=val2&...
     * @returns {Object} un objet dont les propriétés sont les noms des paramètres
     */
    function parseQueryString(qs) {
        let ret = {};
        qs.split("&").forEach(e => {
            let t = e.split("=");
            if (t.length === 2) {
                ret[t[0]] = t[1];
            }
        });
        return ret;
    }

    /**
     * Décode une description de grille (contenant des chiffres, et les lettres "a", "b", "c")
     * @param {*} str la chaîne décrivant la grille
     * @returns le tableau décodé s'il est correct, null sinon.
     */
     function importFromString(str) {
        try {
            let tab = JSON.parse(str.replaceAll("a","[").replaceAll("b","]").replaceAll("c",","));
            // tab est un tableau de longueur 2
            if (!(tab instanceof Array && tab.length == 2)) {
                console.log("Pas un tableau de taille 2");
                return null;
            }
            // les deux éléments sont eux-mêmes des tableaux
            if ((!tab[0] instanceof Array) || (!tab[1] instanceof Array)) {
                console.log("Pas de sous-tableaux");
                return null;
            }
            // tableaux de longueur au moins 2
            if (tab[0].length < 2 || tab[1].length < 2) {
                console.log("Pas de sous-tableaux de taille 2");
                return null;
            }
            // vérification que l'on a que des nombres positifs dans des tableaux 
            if (! tab[0].every(t => t instanceof Array && t.every(e => Number(e) > 0))) {
                console.log("Les tableaux du premier sous-tableau ne contiennent pas que des nombres positifs.")
                return null;
            }
            if (! tab[1].every(t => t instanceof Array && t.every(e => Number(e) > 0))) {
                console.log("Les tableaux du second sous-tableau ne contiennent pas que des nombres positifs.")
                return null;
            }
            // vérification que la somme des nombres dans les lignes égale celle des colonnes
            let somme = 0;
            tab[0].forEach(t => t.forEach(e => somme += Number(e)));
            tab[1].forEach(t => t.forEach(e => somme -= Number(e)));
            if (somme !== 0) {
                console.log("La somme de lignes est différente de la somme des colonnes.")
                return null;
            }
            return tab;
        }
        catch (err) {
            return null;
        }
    }    


    /**************************************************************
     *      Fonctions gérant les affichages dans la page 
     **************************************************************/

    /**
     * Initialise une grille vide dans le document. 
     */
    function initGrid() {
        // récupération du tableau HTML représentant la grille. 
        let tbody = document.querySelector(".grid tbody");
        
        // première ligne : description des colonnes
        tbody.innerHTML = "<tr><td></td>" + Array(grid.cols).fill("0").map((_e, i) => `<td id="column${i}"></td>`).join("") + "</tr>";
        
        // lignes suivantes : le contenu de la grille (cellules avec des attributs personnalisés)
        for (let l=0; l < grid.matrix.length; l++) {
            let tr = document.createElement("tr");
            let td0 = document.createElement("td");
            td0.id = "line" + l;
            tr.appendChild(td0);
            for (let c=0; c < grid.matrix[l].length; c++) {
                let td = document.createElement("td"); 
                td.dataset.l = l;
                td.dataset.c = c;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    };

    /**
     * Construit et affiche le lien de partage.
     */
     function showShareLink() {
        let shareLink = window.location.href.substring(0, window.location.href.indexOf("?"));
        shareLink += "?play=" + grid.exportToString();
        document.querySelector("main p > span").innerHTML = 
            "Lien de partage : <a href='" + shareLink + "' target='_blank'>" +
            (shareLink.length > 40 ? (shareLink.substring(0, 40) + "...") : shareLink) + 
            "</a>";
    }

    /**
     * Affiche les descrptions de lignes et de colonnes de la grille.
     * @param {Array} desc un tableau de deux éléments contenant les descriptions à afficher.
     */
    function showDescription(desc) {
        let descL = desc[0];
        for (let i=0; i < descL.length; i++) {
            document.getElementById("line" + i).innerHTML = descL[i].join(" ");
        }
        let descC = desc[1];
        for (let i=0; i < descC.length; i++) {
            document.getElementById("column" + i).innerHTML = descC[i].join("<br>");
        }
    }


    /**
     * Génère le squelette de code HTML constituant le corps du document (paragraphe + tableau pour la grille).  
     * @returns {string} du code HTML
     */
    function getHTMLSkeleton() {
        return "<main><p><span>&nbsp;</span><a href='" + window.location.href.substring(0, window.location.href.indexOf("?")) + "' style='float: right;'>Retour</a></p><table class='grid'><tbody></tbody></table></main>";
    }




    /**************************************************************
     *          Fonctions gérant les interactions souris
     **************************************************************/

    /**
     * Fonction appelée quand on clique sur la grille en mode "edition"
     * @param {MouseEvent} e événement souris
     * @returns undefined
     */
    function clickWhenEditing(e) {
        if (!e.target.dataset.l) {
            return;
        }
        e.target.classList.toggle("clicked");
        let l = Number(e.target.dataset.l);
        let c = Number(e.target.dataset.c);
        
        grid.toggle(l, c);

        let descL = grid.getLineDescription(l);
        let descC = grid.getColumnDescription(c);

        // mise à jour de la description de la ligne et la colonne correspondantes
        document.getElementById("line" + l).innerHTML = descL.join(" ");
        document.getElementById("column" + c).innerHTML = descC.join("<br>");

        // mise à jour du lien de partage
        showShareLink();
    }

    /**
     * Fonction appelée quand on clique sur la grille en mode "jeu"
     * @param {MouseEvent} e événement souris
     * @returns undefined
     */
    function clickWhenPlaying(e) {

        // vérification que l'on a cliqué sur une case de la grille (présence d'attributs personnalisés)
        if (!e.target.dataset.l) {
            return;
        }
        e.target.classList.toggle("clicked");
        
        // récupération des coordonnées cliquées
        let l = Number(e.target.dataset.l);
        let c = Number(e.target.dataset.c);
        grid.toggle(l, c);

        // vérification par rapport à la description de la ligne
        let descL = grid.getLineDescription(l);
        if (checkSolution(description[0][l], descL)) {  // si compatible
            document.getElementById("line" + l).classList.remove("error");
        }
        else {                                          // si incompatible
            document.getElementById("line" + l).classList.add("error");
        }

        // vérification par rapport à la description de la colonne
        let descC = grid.getColumnDescription(c);
        if (checkSolution(description[1][c], descC)) {   // si compatible
            document.getElementById("column" + c).classList.remove("error");
        }
        else {                                           // si incompatible
            document.getElementById("column" + c).classList.add("error");
        }

        // détection de la résolution complète : pas d'erreurs et nombre de case noircies attendues
        if (document.querySelector(".grid .error") === null && document.querySelectorAll(".grid .clicked").length === size(description)) {
            document.querySelector(".grid").classList.add("finished");
        }
        else {
            document.querySelector(".grid").classList.remove("finished");
        }

    }

    /**
     * Calcule la taille d'une solution proposée (nombre de cases cochées).
     * @param {Array} solution la solution proposée sous forme de tableaux de tableaux
     * @return {number}
     */
    function size(solution) {
        return solution[0].reduce((acc0, e0) => acc0 + e0.reduce((acc1, e1) => acc1 + e1, 0), 0);
    }

    /**
     * Vérifie si une proposition est "compatible" avec une solution (description de ligne/colonne).
     * @param {Array} sol la description de la ligne/colonne
     * @param {Array} prop la proposition à évaluer
     * @returns true si compatible, false sinon
     */
    function checkSolution(sol, prop) {
        // cas facile : la proposition est vide --> OK
        if (prop.length == 0) {
            return true;
        }
        // cas facile : la proposition contient trop de blocs --> KO
        if (prop.length > sol.length) {
            return false;
        }
        // cas pénibles : on vérifie les composantes une par une (modulo éventuels décalages) 
        // par exemple  [1, 2] vs. [1, 1]   --> OK
        //              [1, 2] vs. [2, 1]   --> KO
        //              [1, 2] vs. [3]      --> KO
        let debut = 0;
        for (let j in prop) {
            let val = prop[j];
            let i = findIndexLessOrEqualToFrom(sol, val, debut)
            if (i < 0 || i > j) {
                return false;
            }
            debut = i+1;
        }
        return true;
    }

    /**
     * Calcule l'indice de la dernière valeure inférieure ou égale à une valeur donnée à partir d'une certaine position. 
     * @param {Array} tab le tableau à considérer
     * @param {number} val la valeur cherchée
     * @param {number} from l'indice de départ
     * @returns -1 si non trouvé.
     */
    function findIndexLessOrEqualToFrom(tab, val, from) {
        for (let i=from; i < tab.length; i++) {
            if (val <= tab[i]) {
                return i;
            }
        }
        return -1;
    }

});