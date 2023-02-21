import 'mocha';
import { assert } from 'chai';
import classic from '../../dist/src/classic';
import testConfig from '../_/classic/config'; // This is the config file specifically for testing

const { controller } = classic;

describe('[Classic] Config Test', () => {
    let config: typeof import('../../dist/src/classic/utils/config').Config;
    it('Should attempt to load the controller using our test config', async () => {
        await controller.start(testConfig);
        config = controller.getConfig();
    });
    it('Should have loaded deployInfo', () => {
        assert.isObject(config.deployInfo);
        assert.isNotEmpty(config.deployInfo);
    });
});
