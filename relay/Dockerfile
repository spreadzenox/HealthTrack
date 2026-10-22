# Relais Cloud Run de Halcya (journal/INFRA.md). Construit par .github/workflows/relay-deploy.yml, qui copie d'abord
# la base d'ingrédients de l'app dans data/ingredients.json. Aucune dépendance npm : Node seul.
FROM node:22-alpine
WORKDIR /srv
ENV NODE_ENV=production INGREDIENTS_PATH=/srv/data/ingredients.json
COPY package.json ./
COPY src ./src
COPY data/ingredients.json ./data/ingredients.json
USER node
CMD ["node", "src/index.js"]
