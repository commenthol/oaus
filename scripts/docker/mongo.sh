#!/bin/bash

# https://hub.docker.com/_/mongo/
# docker pull mongo

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
NAME=mongo

case $1 in
exec)
  docker exec -it $NAME bash
  ;;
kill)
  docker stop $NAME
  docker rm $NAME
  ;;
*)
  docker run \
  -d --name $NAME \
  -p 127.0.0.1:27017:27017 \
  -v $CWD/mongo:/data/db \
  mongo
  ;;
esac
