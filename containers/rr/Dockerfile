FROM ubuntu:xenial

WORKDIR /tmp/

RUN apt-get update
RUN apt-get install -y ccache cmake make g++-multilib gdb \
  pkg-config coreutils python3-pexpect manpages-dev git \
  ninja-build capnproto libcapnp-dev

RUN git clone https://github.com/mozilla/rr.git
RUN mkdir obj && cd obj
RUN cmake ../rr

RUN make
RUN make install
