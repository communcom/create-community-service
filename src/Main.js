const core = require('cyberway-core-service');
const BasicMain = core.services.BasicMain;
const env = require('./data/env');
const Connector = require('./services/Connector');
const Emit = require('./services/Emit');

class Main extends BasicMain {
    constructor() {
        super(env);

        this.startMongoBeforeBoot(null);
        const connector = new Connector();
        const emit = new Emit();
        this.addNested(connector, emit);
    }
}

module.exports = Main;
