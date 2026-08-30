# Mettre en ligne le site [6flt] Photographie

Le site est 100 % statique : aucun serveur à payer, hébergement gratuit sur GitHub Pages.

## 1. Créer le dépôt GitHub (5 min)

1. Crée un compte sur github.com si tu n'en as pas.
2. Clique sur **New repository**, nomme-le par ex. `6flt-site`, laisse-le **Public**, puis **Create repository**.
3. Sur la page du dépôt : **uploading an existing file** → glisse-dépose TOUT le contenu du dossier `6flt-site` (les fichiers ET les dossiers `css`, `js`, `data`, `images`) → **Commit changes**.

## 2. Activer GitHub Pages (2 min)

1. Dans le dépôt : **Settings → Pages**.
2. Source : **Deploy from a branch** → branche `main`, dossier `/ (root)` → **Save**.
3. Après 1 à 2 minutes, le site est en ligne sur :
   `https://TON-PSEUDO.github.io/6flt-site/`

## 3. Activer le mode édition drag & drop

La page `admin.html` (ex. `https://TON-PSEUDO.github.io/6flt-site/admin.html`) te permet, sans toucher au code :

- d'**ajouter des photos** en les glissant-déposant (redimensionnées automatiquement) ;
- de **réorganiser** les photos et les **formules** en les faisant glisser ;
- de **modifier les textes et prix** des formules ;
- de **supprimer** une photo du portfolio.

Pour qu'elle puisse publier, il lui faut un token GitHub :

1. GitHub → ta photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Repository access : **Only select repositories** → choisis `6flt-site`.
3. Permissions → **Contents : Read and write**. Génère et copie le token.
4. Colle-le dans la page `admin.html` (il reste uniquement dans ton navigateur).

Chaque « Enregistrer & publier » met le site à jour en 1 à 2 minutes. Ne partage jamais ce token ni le lien admin (la page est inoffensive sans token, mais autant rester discret).

## 4. Le formulaire de contact

Il envoie les messages sur `clementcrusem@gmail.com` via FormSubmit (gratuit).
**Au tout premier envoi**, FormSubmit t'enverra un email « Activate » : clique dessus une fois, ensuite tout arrive directement dans ta boîte mail.
Pour changer d'adresse : modifie la ligne `action="https://formsubmit.co/..."` dans `contact.html` (ou demande-moi).

## 5. Important : tes photos actuelles

Les 78 photos du portfolio pointent pour l'instant vers les serveurs de Pixieset : elles s'affichent tant que ton site Pixieset existe. **Avant de fermer ton compte Pixieset**, ré-ajoute tes photos via le drag & drop de `admin.html` (elles seront alors hébergées dans ton dépôt) et supprime les anciennes, ou envoie-les-moi et je fais la bascule.

## 6. Nom de domaine perso (optionnel)

Tu peux brancher un domaine (ex. `6flt.fr`, ~7-12 €/an chez OVH, Gandi, etc.) :
Settings → Pages → **Custom domain**, puis chez le registrar un enregistrement CNAME vers `TON-PSEUDO.github.io`. Je peux te guider pas à pas le moment venu.

## 7. Customiser le site avec moi, sans blocage

Tout est à toi : HTML/CSS/JS simples, aucune limite de plateforme.
Pour toute modif (couleurs, nouvelles pages, sections, animations…), reviens me voir : je modifie les fichiers et tu n'as plus qu'à les re-glisser dans le dépôt GitHub (ou via admin.html pour photos/formules).
