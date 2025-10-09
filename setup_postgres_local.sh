#!/bin/bash
set -e

PG_VERSION="14"
PG_PATH="/usr/local/Cellar/postgresql@${PG_VERSION}/$(ls /usr/local/Cellar/postgresql@${PG_VERSION})"
PG_DATA="/usr/local/var/postgresql@${PG_VERSION}"

echo "⚙️  Configuration PostgreSQL locale"
echo "Version détectée : ${PG_VERSION}"
echo "Binaire PostgreSQL : ${PG_PATH}"
echo "Répertoire de données : ${PG_DATA}"
echo

# Étape 0 : confirmation
read -p "🔥 Cela va supprimer le dossier ${PG_DATA} s’il existe. Continuer ? (y/n) " confirm
if [[ "$confirm" != "y" ]]; then
  echo "❌ Annulé."
  exit 0
fi

# Étape 1 : suppression du cluster existant
echo "🧹 Suppression de l’ancien cluster..."
rm -rf "$PG_DATA"

# Étape 2 : initialisation
echo "🧱 Initialisation du nouveau cluster..."
"${PG_PATH}/bin/initdb" -D "$PG_DATA" -U postgres -W

# Étape 3 : démarrage du service
echo "🚀 Démarrage du service PostgreSQL..."
brew services start "postgresql@${PG_VERSION}"

sleep 3

# Étape 4 : vérification
if pg_isready > /dev/null 2>&1; then
  echo "✅ PostgreSQL est en ligne."
else
  echo "❌ Erreur : PostgreSQL ne répond pas."
  exit 1
fi

# Étape 5 : création des rôles et bases
echo
echo "🧠 Création de la base et de l’utilisateur de projet..."
read -sp "Mot de passe pour gnosis_user : " GUSER_PASS
echo

"${PG_PATH}/bin/psql" -U postgres -c "CREATE DATABASE gnosis;"
"${PG_PATH}/bin/psql" -U postgres -c "CREATE ROLE gnosis_user LOGIN PASSWORD '${GUSER_PASS}';"
"${PG_PATH}/bin/psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gnosis TO gnosis_user;"

echo
echo "✅ Configuration terminée."
echo "Tu peux maintenant te connecter avec :"
echo "psql -U gnosis_user -d gnosis -h localhost -W"
echo
echo "💡 Pense à mettre à jour ton .env avec :"
echo "DATABASE_URL=\"postgresql://gnosis_user:${GUSER_PASS}@localhost:5432/gnosis\""


