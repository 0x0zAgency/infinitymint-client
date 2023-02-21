import controller from '../src/classic/controller';
import * as ReactConfig from '../src/classic/utils/config';
import glob from 'glob';

(async () => {
    try {
        // Load the default projectUI just for testing
        controller.defaultProjectURI = await controller.getProjectURI(
            'default'
        );

        // Add all the files to mocha.
        await new Promise((resolve, reject) => {
            // Relative to the project root.
            glob('/tests/**/*.test.ts', (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(files.map((filePath) => mocha.addFile(filePath)));
            });
        });

        // After grabbing the files, start the server
        await controller.start(ReactConfig);
        console.log('React server has started!');
        // Now that the server is up, run our test suite!
        mocha.run();
    } catch (error) {
        console.error(error.stack);
        process.exit(1);
    }
})();
