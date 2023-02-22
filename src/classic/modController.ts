import Controller from './controller';
import Resources from './resources';

export class ModController {
    modManifest: any = {}; // Loaded b
    mods: any = {}; // Loaded by config.js
    modMains: any = {}; // Loaded b
    modErrors: any = {}; // Loaded b
    modPages: any = {}; // Loaded b
    modsSuccess: boolean = false; // Set by config.js

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
                    this.disableMod(key);
                    this.pushModError(error, key);
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
}

const modController = new ModController();
export default modController;
