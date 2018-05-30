#!/bin/bash

# https://hub.docker.com/_/mongo/
image=mongo:3.6

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
NAME=mongo
VOLUME=$HOME/.dockervolumes/$NAME

# check if image exists locally otherwise pull
docker inspect --type=image $image > /dev/null 2>&1
if [ $? -ne 0 ] ; then
  docker pull $image
fi

test ! -d $VOLUME && mkdir -p $VOLUME && echo ... $VOLUME created

case $1 in
exec)
  docker exec -it $NAME mongo
  ;;
kill)
  docker stop $NAME
  docker rm $NAME
  ;;
*)
  docker run \
  -d --name $NAME \
  -p 127.0.0.1:27017:27017 \
  -v $VOLUME:/data/db \
  $image
  ;;
esac
