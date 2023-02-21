import controller from '../../src/classic/controller';
import { expect } from 'chai';
import 'mocha';

describe('[Classic] Controller Class', () => {
    it('Executes a contract on chain using `#callMethod`', () => {
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
