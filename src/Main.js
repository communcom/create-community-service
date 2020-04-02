const core = require('cyberway-core-service');
const BasicMain = core.services.BasicMain;
const env = require('./data/env');
const Connector = require('./services/Connector');

class Main extends BasicMain {
    constructor() {
        super(env);

        this.startMongoBeforeBoot(null);
        const connector = new Connector();
        this.addNested(connector);
    }
}

module.exports = Main;
