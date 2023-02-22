import controller from './controller';
import SimpleSVG from './utils/render/SimpleSVG';

/**
 * End Render Methods
 * ===============================================================================
 */

export class TokenMethods {
    manifest: any = {};
    interface: any = {
        type: 'image',
    };

    // Must return HTML or something react can render.
    renderToken = (
        controller, // Instance of src/Controller.js
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Must return an object
    createTokenURI = (
        controller,
        renderedToken,
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Calls after the token is rendered (html is put onto page and can be accessed through document.getELementId)
    postRenderToken = (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {};

    // Called before the token is mounted
    tokenUnmount = (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {};

    // Called everytime the react component is updated
    updateToken = async (
        controller, // Instance of src/Controller.js
        renderedToken,
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Called when the window is resized
    onWindowResize = (controller) => {};

    /**
     * For each InfinityMint asset contract a render method and createTokenURI method is defined
     * to handle the various different circumstances
     */
    scripts: any = {
        default: 'SimpleSVG',
        // NOTE: simpleSVG is defined by default but might move back into solidity
        // TODO: Version2 needs to accept options object so we can render differently depending on what page we are on ETC: Gallery, thumbnail etc
        // lower res versions need to be rendered for the thumbnails specifically
        RaritySVG: 'SimpleSVG',
    };

    /**
     * Takes name of script file to get methods from inside Deployments/Scripts so for instance: SimpleImage, RarityToken
     * @param {string} key
     * @returns
     */
    getScript(key) {
        if (typeof this.scripts[key] === 'string') {
            return this.scripts[this.scripts[key]];
        }

        return this.scripts[key];
    }

    /**
     *
     * @param {object} token
     * @param {Array} stickers
     * @param {bool} isTokenURI
     * @param {bool} isHeaderless
     * @returns
     */

    getRenderedToken(token, stickers, settings = {}) {
        const result = this.renderToken(controller, token, stickers, settings);

        if (result === null || result === undefined) {
            throw new Error(
                'invalid render token function must return something'
            );
        }

        return result;
    }

    /**
     *
     * @param {*} token
     * @param {*} renderedToken
     * @param {*} stickers
     * @param {*} settings
     * @returns
     */
    getTokenURI(token, renderedToken, stickers, settings = {}) {
        const result = this.createTokenURI(
            controller,
            renderedToken,
            token,
            stickers,
            settings
        );

        if (typeof result !== 'object') {
            throw new TypeError('invalid tokenURI');
        }

        return result;
    }
    /**
     *
     * @returns
     */
    load() {
        let Config = controller.getConfig();
        this.scripts['SimpleSVG'] = this.scripts['SimpleSVG'] || SimpleSVG;
        this.scripts = Config.tokenMethodScripts;
        this.renderToken = this.getScript('default').renderToken;
        this.createTokenURI = this.getScript('default').createTokenURI;

        let renderScript =
            Config.deployInfo?.modules?.renderScript ||
            Config.deployInfo?.modules?.controller;
        controller.log(
            'loading token methods for ' + renderScript,
            'token method'
        );

        // For backwards compatability
        if (renderScript === 'RarityImage' || renderScript === 'SimpleImage') {
            renderScript = 'ImageAsset';
        }

        if (
            renderScript === undefined ||
            this.scripts[renderScript] === undefined
        ) {
            console.log(
                ' ! Controller module ' +
                    renderScript +
                    ' does not have render/createTokenURI methods defined!'
            );
            return;
        }

        try {
            this.renderToken = this.getScript(renderScript).renderToken;
            this.createTokenURI = this.getScript(renderScript).createTokenURI;
            this.updateToken = this.getScript(renderScript).updateToken;
            this.tokenUnmount = this.getScript(renderScript).tokenUnmount;
            this.postRenderToken = this.getScript(renderScript).postRenderToken;
            this.onWindowResize = this.getScript(renderScript).onWindowResize;
            this.interface = {
                ...this.getScript(renderScript).interface,
            };
        } catch (error) {
            controller.log(
                '[😞] Failed to map one or more methods from token script file.',
                'error'
            );
            controller.log(error);
        }
    }
}

/**
 * tokenMethods class to execute render/createTokenURI methods based on what module we have loaded. So we can render SVG and Audiocover and
 * what ever and have it in a nice maintainable way.
 */
const tokenMethods = new TokenMethods();
export default tokenMethods;
