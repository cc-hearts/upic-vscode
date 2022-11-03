FROM node:16

LABEL maintainer="heart<7362469@qq.com>"

WORKDIR /usr/interval

COPY src/ /usr/interval/src/

COPY package.json /usr/interval/package.json

COPY app.yaml /usr/interval/app.yaml

RUN npm config set registry https://registry.npm.taobao.org

RUN npm i

EXPOSE 5782

CMD npm run start
