FROM node:18-alpine

ADD package* ./scripts /scripts/
WORKDIR /scripts
RUN npm install

CMD ["npm", "start"]
