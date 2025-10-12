# Guide d'importation CSV pour les Clients

## Vue d'ensemble

La fonctionnalité d'importation CSV vous permet d'ajouter plusieurs clients en une seule fois en téléchargeant un fichier CSV correctement formaté.

## Format du fichier CSV

### Structure requise

Votre fichier CSV doit contenir les colonnes suivantes (en français, dans n'importe quel ordre):

| Colonne | Obligatoire | Type | Description |
|---------|-------------|------|-------------|
| `nom` | ✅ Oui | Texte | Nom du client |
| `description` | ❌ Non | Texte | Description détaillée du client |
| `statut` | ✅ Oui | Enum | Statut actuel: `a_faire`, `en_cours`, ou `termine` |
| `email_utilisateur` | ✅ Oui | Email | Email de l'utilisateur assigné (doit exister dans le système) |
| `periodicite` | ✅ Oui | Enum | Fréquence: `mensuel`, `trimestriel`, `semestriel`, ou `annuel` |
| `mois_periodicite` | ✅ Oui | Nombres | Mois concernés (1-12), séparés par des virgules |

### Valeurs valides

#### Statut
- `a_faire` - À faire
- `en_cours` - En cours
- `termine` - Terminé

#### Périodicité
- `mensuel` - Mensuel (tous les mois)
- `trimestriel` - Trimestriel (4 fois par an)
- `semestriel` - Semestriel (2 fois par an)
- `annuel` - Annuel (1 fois par an)

#### Periodicity Months
Les mois doivent être spécifiés comme des nombres de 1 à 12:
- 1 = Janvier
- 2 = Février
- 3 = Mars
- 4 = Avril
- 5 = Mai
- 6 = Juin
- 7 = Juillet
- 8 = Août
- 9 = Septembre
- 10 = Octobre
- 11 = Novembre
- 12 = Décembre

**Exemples:**
- Mensuel: `"1,2,3,4,5,6,7,8,9,10,11,12"`
- Trimestriel: `"1,4,7,10"` (premier mois de chaque trimestre)
- Semestriel: `"1,7"` (janvier et juillet)
- Annuel: `"1"` (janvier seulement)

## Exemple de fichier CSV

```csv
nom,description,statut,email_utilisateur,periodicite,mois_periodicite
Client ABC,Description du client ABC,a_faire,jean.dupont@example.com,mensuel,"1,2,3,4,5,6,7,8,9,10,11,12"
Client XYZ,Projet trimestriel,en_cours,marie.martin@example.com,trimestriel,"1,4,7,10"
Client 123,Audit semestriel,termine,pierre.bernard@example.com,semestriel,"1,7"
Client DEF,Revue annuelle,a_faire,sophie.durand@example.com,annuel,1
```

## Instructions d'importation

1. **Télécharger le modèle**
   - Cliquez sur le bouton "Importer CSV" dans la page Clients
   - Téléchargez le fichier modèle fourni
   - Ouvrez-le dans Excel, Google Sheets, ou un éditeur de texte

2. **Remplir vos données**
   - Gardez la ligne d'en-tête (première ligne)
   - Ajoutez vos clients ligne par ligne
   - Assurez-vous que les emails des utilisateurs existent dans le système
   - Utilisez les guillemets doubles pour les valeurs contenant des virgules

3. **Sauvegarder le fichier**
   - Enregistrez en format CSV (séparateur: virgule)
   - Encodage recommandé: UTF-8

4. **Importer**
   - Retournez dans l'application
   - Cliquez sur "Importer CSV"
   - Sélectionnez votre fichier
   - Vérifiez l'aperçu des données
   - Cliquez sur "Importer"

## Règles de validation

Le système validera automatiquement:

✅ **Champs obligatoires:** nom, statut, email_utilisateur, periodicite, mois_periodicite
✅ **Format des emails:** L'email doit correspondre à un utilisateur existant
✅ **Valeurs des statuts:** Doit être a_faire, en_cours, ou termine
✅ **Valeurs de périodicité:** Doit être mensuel, trimestriel, semestriel, ou annuel
✅ **Mois valides:** Nombres entre 1 et 12
✅ **Nombre de mois:** Doit correspondre à la périodicité choisie

## Messages d'erreur courants

### "Utilisateur non trouvé"
- L'email spécifié n'existe pas dans le système
- Vérifiez l'orthographe de l'email
- Assurez-vous que l'utilisateur est créé avant l'importation

### "Statut invalide"
- Le statut doit être exactement: `a_faire`, `en_cours`, ou `termine`
- Attention aux minuscules et underscores
- Pas d'espaces supplémentaires

### "Périodicité invalide"
- Utilisez exactement: `mensuel`, `trimestriel`, `semestriel`, ou `annuel`
- Attention aux minuscules et accents

### "Mois de périodicité invalides"
- Les mois doivent être séparés par des virgules
- Utilisez des guillemets doubles si nécessaire
- Assurez-vous que tous les mois sont entre 1 et 12

## Conseils

💡 **Testez avec peu de données** - Commencez par importer 2-3 clients pour vérifier le format

💡 **Sauvegardez régulièrement** - Gardez une copie de votre fichier CSV

💡 **Vérifiez les emails** - Assurez-vous que tous les utilisateurs assignés existent

💡 **Utilisez le modèle** - Le fichier téléchargé depuis l'application est toujours à jour

💡 **Consultez les erreurs** - En cas d'erreur, ouvrez la console du navigateur (F12) pour voir les détails

## Support

Si vous rencontrez des problèmes lors de l'importation:
1. Vérifiez que votre fichier respecte le format indiqué
2. Assurez-vous que tous les utilisateurs assignés existent
3. Téléchargez à nouveau le modèle pour avoir le format le plus récent
4. Consultez les messages d'erreur dans la console du navigateur

