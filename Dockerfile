FROM ubuntu:latest

RUN apt-get update && apt-get install -y curl wget

ADD /scripts /scripts/
RUN bash /scripts/init.sh

CMD bash /scripts/run.sh
