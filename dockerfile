FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# generate prisma client
RUN npx prisma generate

# build next app
RUN npm run build

EXPOSE 3000

CMD ["npm","run","start"]