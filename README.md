# Print Screen as a Service (PrtScaaS.js)

## Run with npm
Install the JavaScript runtime environment `Node.js` and the JavaScript package manager `npm`.
Then install all required node modules with the command `npm install`. 

Then you can run with the service with the command `npm run start`

## Run as a Docker container
To spin up a quick container:
```
docker run --rm -it -p 3000:3000 $(docker build -q .)
```
Or using docker-compose: 
```
docker-compose up -d
```

## Help
On the server side there is only one setting, and that for setting the port 
number. It is done with the `-p, --port int` flag like this:
```
npm run start -- --port 8080
```
It can also be achieved by setting the environment variable PORT and then parsed to the docker container with environment flag `-e, --env`. Or just publish the container port to a different host port.

On client side the configuration can be set with with a url query string when 
accessing the service. All available parameters can be displayed by calling the 
web server only by its host and port with no path or query.

# License
See the LICENSE file for license rights and limitations (GPL-3.0).
