import Controller from './controller.js';

/**
 *
 */
export class PageController {
    pages = [];
    developerPages = [];
    fakePages = [];

    registerFakePage(page, name = null) {
        if (page.name === undefined) {
            try {
                if (name === null) {
                    name = new page()?.constructor?.name;
                }
            } catch (error) {
                console.log(error);
                throw new Error(
                    'name cannot be determined automaticaly, please enter third parameter a unique name'
                );
            }

            if (name === undefined || name == null || name.length === 0) {
                throw new Error(
                    'name cannot be determined automaticaly, please enter third parameter a unique name'
                );
            }

            page.name = name;
        }

        if (page.id === undefined) {
            page.id = page.name;
        }

        console.log('[✒️pages] registering fake page ' + page.id);
        page.pageId = Controller.Base64.encode('Fake_' + page.id);
        this.fakePages.push(page);
    }

    registerPage(page, developer = true, name = null, mod = false) {
        if (page.name === undefined) {
            try {
                if (name === null) {
                    name = new page()?.constructor?.name;
                }
            } catch (error) {
                console.log(error);
                throw new Error(
                    'name cannot be determined automaticaly, please enter third parameter a unique name'
                );
            }

            if (name === undefined || name == null || name.length === 0) {
                throw new Error(
                    'name cannot be determined automaticaly, please enter third parameter a unique name'
                );
            }

            page.name = name;
        }

        if (page.id === undefined) {
            page.id = page.name;
        }

        console.log('[✒️pages] registering page ' + page.name);
        page.pageId = mod
            ? Controller.Base64.encode('Mod_' + page.id + '|' + page.url)
            : Controller.Base64.encode(page.id + '|' + page.url);

        if (developer) {
            Controller.log(
                'registered developer page name of ' +
                    page.id +
                    ' to url: ' +
                    page.url +
                    ' & pageId of ' +
                    page.pageId,
                'pages'
            );
            this.developerPages.push(page);
        } else {
            Controller.log(
                'registered page name of ' +
                    page.id +
                    ' to url: ' +
                    page.url +
                    ' & pageId of ' +
                    page.pageId +
                    (page?.settings?.requireAdmin ? ' [🛡️]' : ''),
                'pages'
            );
            this.pages.push(page);
        }

        return page;
    }

    getPages(production = false) {
        if (production) {
            return this.pages;
        }

        return [...this.pages, ...this.developerPages];
    }
}

const pageController = new PageController();
export default pageController;
