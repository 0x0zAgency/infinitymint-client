require('mocha');
const { assert } = require('chai');
const classic = require('../../dist/src/classic');
const testConfig = require('../_/classic/config'); // This is the config file specifically for testing
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
});
