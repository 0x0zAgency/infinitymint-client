import glob from 'glob';
import Mocha from 'mocha';

(async () => {
    try {
        const mocha = new Mocha();

        // Add all the files to mocha.
        await new Promise((resolve, reject) => {
            // Relative to the project root.
            glob(process.cwd() + '/tests/**/*.test.ts', (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(
                    files
                        .filter((filePath) => filePath.indexOf('/_/') === -1)
                        .map((filePath) => mocha.addFile(filePath))
                );
            });
        });

        // Now that the server is up, run our test suite!
        mocha.run();
    } catch (error) {
        console.error(error.stack);
        process.exit(1);
    }
})();
