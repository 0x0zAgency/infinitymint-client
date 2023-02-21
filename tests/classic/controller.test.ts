import 'mocha';
import { assert } from 'chai';
import classic from '../../dist/src/classic';
import { call, send } from '../../dist/src/classic/helpers';
import testConfig from '../_/classic/config'; // This is the config file specifically for testing

const { controller } = classic;

describe('[Classic] Controller Class', () => {
    let config: typeof import('../../dist/src/classic/utils/config').Config;
    it('Should attempt to load the controller using our current conifg', async () => {
        await controller.start(testConfig);
        config = controller.getConfig();
    });
    it('Should attempt to load a project file', async () => {
        await controller.loadObjectURI();
    });
    it('Should attempt to check if the deployer is approved with the InfinityMint contract (call test)', () => {
        let result = call('InfinityMint', 'isApproved', [
            (config.deployInfo as any).deployer,
        ]);
        assert.isTrue(result);
    });
    it('Should attempt to approve the deployer with the contrac)', () => {
        send('InfinityMint', 'setPrivillages', [
            (config.deployInfo as any).deployer,
        ]);
    });
});
