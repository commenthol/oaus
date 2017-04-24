# Models

Models are extracted from the database using [`sequelize-auto`](https://github.com/sequelize/sequelize-auto)

## Installation

```bash
npm i -g sequelize-auto mysql
```

## Extraction

Run from terminal

```bash
sequelize-auto -o "." -d oauth2 -h localhost -u dev -x dev -p 3306 -e mysql
eslint --fix *.js
```

## Workflow for changes

1. Create a new user named `dev` with password `dev`
2. Import database schema from `/test/support/oauth2-demo.sql`
3. Access database and change tables as you wish
4. Run `sequelize-auto` and change `./models.js` accordingly to your needs
5. Write some tests
