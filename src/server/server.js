const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(
    jsonServer.rewriter({
        'api/smart-x/schema/reports': 'schema',
        'api/smart-x/ui/reports': 'ui',
        'api/smart-x/data/reports': 'data',
        'api/smart-x/preferences/reports': 'preferences'
    })
);

server.use(middlewares);
server.use(router);
server.listen(3002, () => {
    console.log('JSON Server is running');
});
