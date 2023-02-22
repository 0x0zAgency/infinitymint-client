require('mocha');
const { assert } = require('chai');
const classic = require('../../dist/src/classic');
const testConfig = require('../_/classic/config'); // This is the config file specifically for testing
const { call, send } = require('../../dist/src/classic/utils/contract');
const { controller } = classic;

describe('[Classic] Controller Class', () => {
    /**
     * @type {typeof import('../../dist/src/classic/utils/config').Config}
     */
    let config;
    it('Should attempt to load the controller using our current conifg', async () => {
        await controller.start(testConfig);
        config = controller.getConfig();
    });
    it('Should attempt to load a project file', async () => {
        await controller.loadObjectURI();
    });
    it('Should attempt to check if the deployer is approved with the InfinityMint contract (call test)', () => {
        let result = call('InfinityMint', 'isApproved', [
            config.deployInfo.deployer,
        ]);
        assert.isTrue(result);
    });
    it('Should attempt to approve the deployer with the contrac)', () => {
        send('InfinityMint', 'setPrivillages', [config.deployInfo.deployer]);
    });
});
