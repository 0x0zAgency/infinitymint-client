import Controller from './controller.js';
import Resources from './resources.js';

const ModController = new (class {
    modManifest = {};
    mods = {}; // Loaded by config.js
    modMains = {};
    modErrors = {};
    modPages = {}; // Loaded by config.js
    modsSuccess = false; // Set by config.js

    getModManifest(modName) {
        return this.modManifest.mods[modName];
    }

    hasErrors(modName) {
        return (
            this.modErrors[modName] !== undefined &&
            this.modErrors[modName].length > 0
        );
    }

    pushModError(error, modName) {
        if (this.modErrors[modName] === undefined) {
            this.modErrors[modName] = [];
        }

        this.modErrors[modName].push(error);
    }

    getModDescription(modName) {
        return this.modManifest.mods[modName].manifest;
    }

    async callModMethod(method, parameters = {}, specificMod = null) {
        const keys = Object.keys(this.modMains);
        const results = {};
        for (const key of keys) {
            if (!this.isModEnabled(key)) {
                continue;
            }

            if (specificMod !== null && key !== specificMod) {
                continue;
            }

            const main = this.modMains[key];

            if (main[method] === undefined) {
                Controller.log('no mod method ' + method, 'gems');
                continue;
            }

            Controller.log('calling mod method ' + method, 'gems');
            results[key] = await main[method].bind(this)(parameters);
        }

        if (specificMod !== null) {
            return results[specificMod];
        }

        return results;
    }

    async initializeMods() {
        const keys = Object.keys(this.modMains);
        const projectFile = Controller.getProjectSettings();
        for (const key of keys) {
            const main = this.modMains[key];

            if (
                !this.isModEnabled(key) ||
                projectFile.mods[key] === undefined ||
                projectFile.mods[key] === false
            ) {
                Controller.log(
                    'mod ' +
                        key +
                        ' is disabled for ' +
                        Resources.projectName(),
                    'gems'
                );
                this.disableMod(key);
                continue;
            }

            if (
                main.initialize !== undefined &&
                typeof main.initialize === 'function'
            ) {
                Controller.log('calling initialize method for ' + key, 'gems');
                try {
                    await main.initialize();
                    Controller.log(key + ' successfully initialized', 'gems');
                } catch (error) {
                    Controller.log(error);
                    Controller.log(
                        '[⚠️] WARNING! Could not initialize: ' +
                            key +
                            ' mod has been disabled'
                    );
                    ModController.disableMod(key);
                    ModController.pushModError(error, key);
                }
            }
        }
    }

    disableMod(modName) {
        this.mods[modName].enabled = false;
    }

    isModEnabled(modName) {
        return (
            this?.mods[modName] !== undefined &&
            this.mods[modName].enabled === true
        );
    }
})();

export default ModController;
