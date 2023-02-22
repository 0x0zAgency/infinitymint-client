require('mocha');
const { assert } = require('chai');
const classic = require('../../dist/src/classic').default;
const testConfig = require('../_/classic/config.js'); // This is the config file specifically for testing
const { controller } = classic;

describe('[Classic] Config Test', () => {
    /**
     * @type {typeof import('../../dist/src/classic/utils/config').Config}
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
