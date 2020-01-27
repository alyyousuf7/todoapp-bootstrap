FROM node:12

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

ENTRYPOINT ["./entrypoint.sh"]
CMD ["yarn", "watch"]
