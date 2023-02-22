import controller from 'infinitymint-client/dist/src/classic/controller';

const ContentLinks = {
    getViewTokenSidebarChildren: async ({ token }) => {
        return <></>;
    },

    onLink: async (link) => {},
    /**
     *
     * @param {Controller} param0
     */
    initialize: async () => {
        controller.initializeContract(
            controller.getProjectSettings().contracts['Mod_SelectiveMint'],
            'Mod_SelectiveMint',
            true
        );
    },
};

export default ContentLinks;
