# Models

Models have been created in the database first and then extracted from the database using [`sequelize-auto`](https://github.com/sequelize/sequelize-auto)

```bash
npm i -g sequelize-auto mysql
```

to extract

```bash
sequelize-auto -o "." -d oauth2 -h localhost -u dev -x dev -p 3306 -e mysql
eslint --fix *.js
```

## Create Tables in DB

1. Create a new database (e.g. `oauth2`)
2. Change the config in `createTables.js`
3. Run `createTables.js` - make sure it passes, check the tables in the DB

## Stored Procedures

In `sql/procedures.sql` there are stored procedures which speed up querying the database. The calls are implemented in `model-procedures.js` and can be enabled using `config.storedProcedures: true`
