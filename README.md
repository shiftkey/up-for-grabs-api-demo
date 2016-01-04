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

 - granularity of the API endpoints

Should we return the issue count for all repos, or keep the specific options? Or both? This will mean the client makes fewer requests, but we would then need to warm up the cache to get all the results first (which isn't so hard, but we're up to 175 projects on GitHub already)...

 - warming up the cache after deployment

 This could be done by providing a restricted endpoint which can be called after a deployment (with the right token set) to refresh whatever has been stored

 - move the data folder into a submodule reference

 There's an upstream PR https://github.com/up-for-grabs/up-for-grabs.net/pull/302 to fix the projects which can't be parsed in `yamljs` due to being multi-line strings.

 After that, I'll rewrite the history here to change that to a submodule.

 - get this behind a nice DNS record

Something like `api.up-for-grabs.net`?

After that we can look at migrating the existing website to leverage this sort of data.
