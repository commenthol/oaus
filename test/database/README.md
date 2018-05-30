# Testdata for SQL database

1. Start docker container with mysql
   ```
   ./scripts/docker/mysql.sh
   ```
2. Access container
   ```
   ./scripts/docker/mysql.sh exec
   ```
3. Create a new database
   ```sql
   CREATE DATABASE `oauth2` COLLATE 'utf8mb4_bin';
   SHOW DATABASES;
   ```
4. Insert test data with
   ```
   node test/database/mysql.js
   ```

# Testdata for Mongo-DB

1. Start the Mongo-DB e.g.
   ```
   ./scripts/docker/mongo.sh
   ```
2. Insert test data with
   ```
   node test/database/mongo.js
   ```

## Restore

```
cp test/database/oauth2-test.mongo scripts/docker/mongo

docker exec -it mongo bash

mongorestore -d oauth2 --archive=/data/db/oauth2-test.mongo --gzip
```

## Dump

```
docker exec -it mongo bash

mongodump -d oauth2 --archive=/data/db/oauth2-test.mongo --gzip
exit

cp $HOME/.dockervolumes/mongo/oauth2-test.mongo test/database
```
