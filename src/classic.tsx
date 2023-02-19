import * as Controller from './classic/controller';
import * as ModController from './classic/modController';
import * as StorageController from './classic/storageController';
import * as Helpers from './classic/helpers';
import * as PageController from './classic/pageController';
import * as StickerController from './classic/stickerController';
import * as Resources from './classic/resources';
import * as TinySVG from './classic/tinysvg';
import * as IPFSController from './classic/ipfsController';
import * as TokenMethods from './classic/tokenMethods';

const _controller = Controller.default;
const _modController = ModController.default;
const _storageController = StorageController.default;
const _helpers = Helpers;
const _pageController = PageController.default;
const _stickerController = StickerController.default;
const _resources = Resources.default;
const _tinySVG = TinySVG.default;
const _ipfsController = IPFSController.default;
const _tokenMethods = TokenMethods.default;

const exportDefaultExports = {
    Controller: _controller,
    ModController: _modController,
    StorageController: _storageController,
    Helpers: _helpers,
    PageController: _pageController,
    StickerController: _stickerController,
    Resources: _resources,
    TinySVG: _tinySVG,
    IPFSController: _ipfsController,
    TokenMethods: _tokenMethods,
};
export default exportDefaultExports;
