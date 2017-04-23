#!/bin/bash

# https://hub.docker.com/_/mysql/
# docker pull mysql

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
NAME=mysql

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
  -p 127.0.0.1:3306:3306 \
  -v $CWD/mysql:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=dev \
  mysql
  ;;
esac

