const router = require("express").Router();
const api = require('./api');

router.get('/name/:name', api.pingPongName)

module.exports = router;