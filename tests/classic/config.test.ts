import 'mocha';
import { assert } from 'chai';
import controller from '../../dist/src/classic/controller';
import * as testConfig from '../_/classic/config'; // This is the config file specifically for testing

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
