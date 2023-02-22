require('mocha');
const { assert } = require('chai');
const testConfig = require('../_/classic/config.js'); // This is the config file specifically for testing
const controller = require('../../dist/src/classic/controller').default; //the controller
const { send, call } = require('../../dist/src/classic/helpers');

describe('[Classic] Controller Class', () => {
    /**
     * @type {typeof import('../../dist/src/classic/utils/config.mjs').Config}
     */
    let config;
    /**
     * @type {typeof import('infinitymint/dist/app/interfaces').InfinityMintProjectJavascript}
     */
    let project;
    it('Should attempt to load the controller using our current conifg', async () => {
        await controller.start(testConfig);
        config = controller.getConfig();
    });
    it('Should attempt to load the project file', async () => {
        project = await controller.loadObjectURI();

        assert.isObject(project);
        assert.isNotEmpty(project);
        assert.equal(project.project, config.deployInfo.project);
    });

    it('Should have loaded InfinityMint ABI and project contract should match deployInfo contract', () => {
        assert.isNotEmpty(controller.getContract('InfinityMint'));
        assert.equal(
            project.contracts['InfinityMint'],
            config.deployInfo.contracts['InfinityMint']
        );
    });

    it('Should try and get the max supply, should be equal to a variable in the project file', async () => {
        let result = await call('InfinityMint', 'totalSupply');
        assert.equal(result, project.deployment.maxSupply);
    });

    it('Should return that the current deployer is authenticated', async () => {
        let result = await call('InfinityMint', 'isAuthenticated', [
            config.deployInfo.deployer,
        ]);
        assert.isTrue(result);
    });

    it('Should try and authenticate the current deployer with the InfinityMint contract', async () => {
        await send('InfinityMint', 'setPrivilages', [
            config.deployInfo.deployer,
            true,
        ]);
        let result = await call('InfinityMint', 'isAuthenticated', [
            config.deployInfo.deployer,
        ]);
        assert.isTrue(result);
    });
});
