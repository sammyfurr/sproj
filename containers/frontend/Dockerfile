FROM node:erbium-buster

WORKDIR /tmp/
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get update
RUN apt-get install -y python3-pip

WORKDIR /
RUN mkdir frontend
WORKDIR /frontend/

RUN mkdir react-flask-app
WORKDIR react-flask-app
RUN mkdir api src public

RUN pip3 install flask kubernetes pymongo python-dotenv

COPY react-flask-app/api/ ./api/
COPY react-flask-app/src/ ./src/
COPY react-flask-app/public/ ./public/

COPY react-flask-app/package.json .

RUN yarn install

COPY react-flask-app/startup.sh .
CMD ["sh", "startup.sh"]
