# Up For Grabs API Proxy

This is a little proof-of-concept about making the up-for-grabs.net
site more interactive, using live data from the GitHub API.

## Why?

Currently up-for-grabs.net will fetch some data within the user's browser using AJAX. This is limited in a couple of ways:

 - no way for us to specify a token, so unauthenticated API access
   is limited to 60 requests per hour
 - because we're querying the API directly, we're limited in what
   operations we can perform

Anyway, what we're doing on the site is fetching the number of open issues for each project. This demo ports that behaviour over to a front-end which circumvents these limitations.

## How?

This is a little NodeJS app hosted on Heroku which is a API backed by a memcached key-value store. Imagine there's a script in the user's browser which fetches the data it requires:

`GET /issues/count?project=albacore`

In the backend, we'll check the key-value store for our relevant value:

 - if it exists, just return it directly
 - if it doesn't exist, we compute the value and store it

And that's it. And because we control the HTTP request here, we can set a Personal Access Token and give ourselves greater API access

## What's Next To Do?

A few things come to mind:

 - granularity of the API - should we return the issue count for all repos, not just specific ones
 - warming up the cache after deployment
 - move the data folder into a submodule reference - there's an upstream PR to fix the projects which can't be parsed in `yamljs`

After that we can look at other sorts of data we can extract from the API.




# node-js-sample

A barebones Node.js app using [Express 4](http://expressjs.com/).

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
git clone git@github.com:heroku/node-js-sample.git # or clone your own fork
cd node-js-sample
npm install
npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
heroku create
git push heroku master
heroku open
```

Alternatively, you can deploy your own copy of the app using the web-based flow:

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Documentation

For more information about using Node.js on Heroku, see these Dev Center articles:

- [10 Habits of a Happy Node Hacker](https://blog.heroku.com/archives/2014/3/11/node-habits)
- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
