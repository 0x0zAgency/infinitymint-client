import * as Controller from './classic/controller';
import * as ModController from './classic/modController';
import * as StorageController from './classic/storageController';
import * as Helpers from './classic/helpers';
import * as PageController from './classic/pageController';
import * as StickerController from './classic/stickerController';
import * as Resources from './classic/resources';
import * as TinySVG from './classic/tinysvg';
import * as TokenMethods from './classic/tokenMethods';

const _controller = Controller.default;
const _modController = ModController.default;
const _storageController = StorageController.default;
const _helpers = Helpers;
const _pageController = PageController.default;
const _stickerController = StickerController.default;
const _resources = Resources.default;
const _tinySVG = TinySVG.default;
const _tokenMethods = TokenMethods.default;

const exportDefaultExports = {
    controller: _controller,
    modController: _modController,
    storageController: _storageController,
    helpers: _helpers,
    pageController: _pageController,
    stickerController: _stickerController,
    resources: _resources,
    tinySVG: _tinySVG,
    tokenMethods: _tokenMethods,
};
export default exportDefaultExports;
