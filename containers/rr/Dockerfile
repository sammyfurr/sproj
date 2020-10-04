FROM  ubuntu:latest

WORKDIR /tmp/
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get update
RUN apt-get install -y apt-utils
RUN apt-get install -y ccache cmake make g++-multilib gdb \
  pkg-config coreutils python3-pexpect manpages-dev git \
  ninja-build capnproto libcapnp-dev

ADD rrbuild.sh ./rrbuild.sh
RUN sh rrbuild.sh && rm -rf rr obj rrbuild.sh
WORKDIR /home/
CMD ["sleep", "3600"]
