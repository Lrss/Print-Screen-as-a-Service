# Print Screen as a Service (PrtScaaS.js)

## Run with npm
Install the JavaScript runtime environment `Node.js` and the JavaScript package manager `npm`.
Then install all required node modules with the command `npm install`. 

Then you can run with the service with the command `npm run start`

## Run in Docker
TODO

## Help
On the server side there is only one setting, and that for setting the port 
number. It is done with the `-p, --port int` flag like this:
```
npm run start -- --port 8080
```
On client side the configuration can be set with with a url query string when 
accessing the service. All available parameters can be displayed by calling the 
web server only by its host and port with no path or query.
