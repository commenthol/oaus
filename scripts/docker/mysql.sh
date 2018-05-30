#!/bin/bash

# https://hub.docker.com/_/mysql/
image="mysql:5.7"
#image=mysql:latest # 8.0.11
CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
NAME=mysql
VOLUME=$HOME/.dockervolumes/$NAME

# check if image exists locally otherwise pull
docker inspect --type=image $image > /dev/null 2>&1
if [ $? -ne 0 ] ; then
  docker pull $image
fi

test ! -d $VOLUME && mkdir -p $VOLUME && echo ... $VOLUME created

case $1 in
exec)
  docker run -it --link $NAME:mysql --rm $image sh -c 'exec mysql -h"$MYSQL_PORT_3306_TCP_ADDR" -P"$MYSQL_PORT_3306_TCP_PORT" -uroot -p"$MYSQL_ENV_MYSQL_ROOT_PASSWORD"'
  ;;
kill)
  docker stop $NAME
  docker rm $NAME
  ;;
*)
  docker run \
  -d --name $NAME \
  -p 127.0.0.1:3306:3306 \
  -v $VOLUME:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=dev \
  $image
  ;;
esac
