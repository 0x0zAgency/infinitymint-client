require('mocha');
const { assert } = require('chai');
const testConfig = require('../_/classic/config.js'); // This is the config file specifically for testing
const controller = require('../../dist/src/classic/controller').default; //the controller

describe('[Classic] Config Test', () => {
    /**
     * @type {typeof import('../../dist/src/classic/utils/config.mjs').Config}
     */
    let config;
    it('Should attempt to load the controller using our test config', async () => {
        await controller.start(testConfig);
        config = controller.getConfig();
    });
    it('Should have loaded deployInfo', () => {
        assert.isObject(config.deployInfo);
        assert.isNotEmpty(config.deployInfo);
    });

    it('Should be the network of ganache', () => {
        assert.equal(config.deployInfo.network, 'ganache');
    });
});
