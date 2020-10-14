FROM  ubuntu:latest

WORKDIR /tmp/
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get update
RUN apt-get install -y ccache cmake make g++-multilib gdb \
  pkg-config coreutils python3-pexpect manpages-dev git \
  capnproto libcapnp-dev python3-pip

ADD rrbuild.sh ./rrbuild.sh
RUN sh rrbuild.sh && rm -rf rr obj rrbuild.sh
RUN useradd -ms /bin/bash debug
USER debug
RUN pip3 install pygdbmi
WORKDIR /home/debug/
RUN mkdir app
WORKDIR /home/debug/app/
COPY cat.c .
COPY test.py .
CMD ["sleep", "3600"]
