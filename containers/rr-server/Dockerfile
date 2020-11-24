FROM  ubuntu:latest

WORKDIR /tmp/
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get update && apt-get install -y python3-pexpect python3-pip

RUN useradd -ms /bin/bash rrserver
USER rrserver
RUN pip3 install requests python-socketio eventlet
WORKDIR /home/rrserver/
RUN mkdir app
WORKDIR /home/rrserver/app/
COPY server.py .
COPY startup.sh .
CMD ["sh", "startup.sh"]
