import { load } from 'infinitymint';
import glob from 'glob';
import Mocha from 'mocha';

(async () => {
    try {
        const mocha = new Mocha();

        // Load the environment.
        await load({
            dontDraw: true,
            scriptMode: true,
        });

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

        // Now that the server is up, run our test suite!
        mocha.run();
    } catch (error) {
        console.error(error.stack);
        process.exit(1);
    }
})();
