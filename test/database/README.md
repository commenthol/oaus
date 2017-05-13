# Testdata for Mongo-DB

1. Start the Mongo-DB e.g. `./scripts/docker/mongo.sh`
2. Connect to the DB and add a new database `oauth2`
   ```
   docker exec -it mongo mongo
   use oauth2
   ```
3. Restore the test-set from `oauth2-test.mongo`

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

cp scripts/docker/mongo/oauth2-test.mongo test/database
```

# Testdata for SQL database

1. Create a new database (e.g. `oauth2`)
2. Change the config in `src/models/sqldb/createTables.js`
3. Run `node src/models/sqldb/createTables.js` - make sure it passes, check the tables in the DB

Insert test data with `oauth2-test.sql`.
