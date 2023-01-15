ARG WORK_DIR=/build

FROM node:18.12 as builder

ARG WORK_DIR
ENV PATH ${WORK_DIR}/node_modules/.bin:$PATH

RUN mkdir ${WORK_DIR}
WORKDIR ${WORK_DIR}

COPY . ${WORK_DIR}

RUN npm install @angular/cli --force
RUN npm install --force

RUN ng build

FROM nginx:latest

ARG WORK_DIR

COPY --from=builder ${WORK_DIR}/dist/front /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD nginx -g "daemon off;"