# Cahier des Charges Fonctionnel & Technique - ThermoMind

## 1. Objectif du Projet
Créer une application web (Web App) **"Mobile First"** capable de transformer n'importe quel texte de recette brut en une interface immersive simulant l'écran de contrôle d'un robot cuiseur haut de gamme (type Thermomix).

---

## 2. Règles Métier : Parsing & Analyse (Le "Cerveau")
L'application doit analyser le texte brut fourni par l'utilisateur pour structurer les données.

### 2.1. Structuration de la Recette
Le parser (analyseur syntaxique) doit découper le texte selon les heuristiques suivantes :
* **Titre :** La première ligne non vide du texte.
* **Ingrédients :** Détection des lignes contenant des mots-clés (*ingrédient, il vous faut, liste*) ou commençant par des puces (-, •).
    * *Nettoyage :* Les mots de liaison ("de", "la", "un") et les unités de mesure sont filtrés pour ne garder que le mot-clé principal de l'ingrédient (ex: "500g de fraises" -> "fraises").
* **Étapes :** Détection des lignes numérotées ou contenant des mots-clés d'action (*préparation, étape*).

### 2.2. Extraction des Paramètres de Cuisson (Par étape)
Pour chaque étape, l'algorithme doit extraire via **Regex** les valeurs suivantes :
* **Temps (Timer) :**
    * Formats reconnus : `sec`, `min`, `mn`, `h`.
    * Comportement : Convertit la valeur en secondes pour le minuteur.
* **Température :**
    * Formats reconnus : `XX°`, `XX°C`, `Varoma`.
    * Standardisation : Ajoute "C" si manquant (sauf Varoma).
* **Vitesse :**
    * Formats reconnus : `vit X`, `vitesse X`, `mijotage`.
    * Mijotage : Affiché comme "MIJOT".
* **Modes Spéciaux (Prioritaires sur la vitesse) :**
    * **Mode Pétrin :** Déclenché par les mots *pétrin, pétrir, épi*. Affiche une icône de blé.
    * **Mode Turbo :** Déclenché par le mot *turbo*. Affiche une icône d'éclair.
* **Sens de Rotation :**
    * Déclenché par les mots *sens inverse, inversé*.
    * Comportement : Active un indicateur visuel spécifique (flèche orange anti-horaire). Désactivé en mode Pétrin.

---

## 3. Interface Utilisateur & Expérience (UX)

### 3.1. Phase d'Entrée (Input)
* **Zone de texte :** Grande zone pour coller le texte brut.
* **Démos :** Boutons d'accès rapide à des recettes pré-chargées (Velouté, Pizza, Crêpes, Risotto).
* **Validation :** Bouton "Cuisiner" actif uniquement si du texte est présent.

### 3.2. Phase de Cuisine (Dashboard)
L'écran est divisé en 3 zones principales :

#### A. Header (Barre supérieure)
* Bouton Retour (Maison) pour revenir à la saisie.
* Titre de la recette (tronqué si trop long).
* **Toggle Thème :** Switch Jour (Clair) / Nuit (Sombre). Défaut : Nuit.
* **Horloge :** Heure réelle de l'appareil utilisateur.
* **Indicateur WiFi :** Icône verte qui pulse lorsque le minuteur est actif.

#### B. Dashboard de Contrôle (Les 3 Cercles)
1.  **Cercle 1 : Temps (Vert)**
    * Affiche le temps extrait ou `--:--`.
    * Interactif : Clic pour lancer/pauser le compte à rebours.
    * Animation : Le texte pulse si le minuteur tourne.
2.  **Cercle 2 : Température (Rouge)**
    * Affiche la température extraite ou `---`.
    * S'allume en rouge/blanc uniquement si une température est détectée.
3.  **Cercle 3 : Vitesse (Bleu)**
    * Affiche la vitesse, l'icône Pétrin ou l'icône Turbo.
    * Animation : L'icône tourne (sens horaire ou anti-horaire) si une vitesse est définie.

#### C. Zone d'Instruction (Centre)
* **Vue d'ensemble (-1) :** Liste complète des ingrédients + Bouton "Démarrer".
* **Vue Étape (>= 0) :**
    * Numéro de l'étape.
    * Texte de l'instruction en gros caractères.
    * **Smart Recall (Rappel Intelligent) :** Affichage dynamique des ingrédients cités dans l'étape courante.

#### D. Navigation (Bas de page)
* Boutons flottants (Précédent / Suivant).
* Positionnés à `bottom-16` (Safe Area mobile).

---

## 4. Fonctionnalité "IA Assistant" (Substitution)
* **Déclencheur :** Clic sur n'importe quel ingrédient.
* **Action :** Ouverture d'une modale (Pop-up).
* **Comportement :** État de chargement ("Analyse...") puis proposition d'une alternative culinaire (ex: Beurre -> Huile de coco).

---

## 5. Contraintes Techniques
* **Framework :** React (Single Page Application).
* **Styling :** Tailwind CSS.
* **Icônes :** Lucide React.
* **Responsive :** Design fluide, optimisé pour mobile.
* **Zéro Backend :** Tout le parsing et la logique s'exécutent côté client.
