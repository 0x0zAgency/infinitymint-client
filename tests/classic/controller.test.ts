import 'mocha';
import controller from '../../src/classic/controller';
import config from '../../src/classic/utils/config';

describe('[Classic] Controller Class', () => {
    it('Executes a contract on chain using `#callMethod`', async () => {
        controller.sendMethod(
            controller.accounts[0],
            'InfinityMint',
            'connect',
            {
                parameters: {
                    filter: '',
                },
            },
            0
        );
    });
    it('Executes a contract on chain using `#sendMethod`', () => {});
});
