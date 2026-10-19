FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173 5001

CMD ["npm", "run", "dev"]
