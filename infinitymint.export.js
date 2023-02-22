const InfinityMintClient = {
    version: 3,
    name: 'InfinityMint-Client',
    supports: {
        webpack: true,
        multiChain: true,
        multiProject: true,
        eads: true,
    },
    locations: {
        deployments: '/tests/_/Deployments/',
        styles: '/tests/_/Styles/',
        images: '/tests/_/Images/',
        mods: '/tests/_/Resources/Mods/',
        scripts: '/tests/_/Resources/Scripts/',
    },
    makeFolders: (Controller) => {
        let locations = [...Object.values(InfinityMintClient.locations)].map(
            (location) => Controller.settings.reactLocation + location
        );

        locations.forEach((location) => {
            if (!Controller.getFileSystem().existsSync(location)) {
                Controller.log('- making ' + location);
                Controller.getFileSystem().mkdirSync(location);
            }
        });
    },
    onCopyDeployments: (deployments) => {},
    onCopyContent: (content) => {},
    onCopyGems: (files) => {},
    onCopyStaticManifest: (staticManifest, projectFile, Controller) => {
        let fileName =
            Controller.settings.reactLocation + 'src/Resources/projects.json';

        let projects = Controller.readInformation(fileName, true);

        if (projects.staticManifests == undefined)
            projects.staticManifests = {};

        if (
            projects.staticManifests[Controller.deployConfig.project] ===
            undefined
        )
            projects.staticManifests[Controller.deployConfig.project] = {};

        Controller.log('- writing ' + fileName);
        projects.staticManifests[Controller.deployConfig.project][
            projectFile.network.chainId
        ] = staticManifest;

        Controller.writeInformation(projects, fileName);
        Controller.log('- writing to dist folder');
        Controller.writeInformation(projects, fileName);
        Controller.writeInformation(
            staticManifest,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                'static_manifest.json'
        );
    },
    onCopyScripts: (scripts, projectFile, Controller) => {
        let fileName =
            Controller.settings.reactLocation + 'src/Resources/projects.json';

        [...(scripts || [])].forEach((script) => {
            Controller.getFileSystem().copyFileSync(
                script.filepath,
                Controller.settings.reactLocation +
                    InfinityMintClient.locations.scripts +
                    script.filename
            );
        });

        let projects = Controller.readInformation(fileName, true);

        if (projects.scriptManifests == undefined)
            projects.scriptManifests = {};

        if (
            projects.scriptManifests[Controller.deployConfig.project] ===
            undefined
        )
            projects.scriptManifests[Controller.deployConfig.project] = {};

        let manifest = {
            updated: Date.now(),
            project: Controller.deployConfig.project,
            scripts: scripts.map((file) => file.filename),
        };

        Controller.log('- writing ' + fileName);
        projects.scriptManifests[Controller.deployConfig.project][
            projectFile.network.chainId
        ] = manifest;

        Controller.log('- writing to dist folder');
        Controller.writeInformation(projects, fileName);
        Controller.writeInformation(
            manifest,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                'script_manifest.json'
        );
    },
    onCopyProject: (projectFile, Controller) => {
        let projects = Controller.readInformation(
            Controller.settings.reactLocation + 'src/Resources/projects.json',
            true
        );

        if (projects.projects === undefined) projects.projects = {};

        if (projects.projects[projectFile.project] === undefined)
            projects.projects[projectFile.project] = {};

        projects.projects[projectFile.project][projectFile.network.chainId] =
            projectFile;

        Controller.writeInformation(
            projects,
            Controller.settings.reactLocation + 'src/Resources/projects.json'
        );
        Controller.log('- writing to dist folder');
        Controller.writeInformation(
            projectFile,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                projectFile.project +
                '.json'
        );
    },
    onCopyDeployInfo: (deployInfo, Controller) => {
        if (
            !Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation +
                    'src/Resources/projects.json'
            )
        ) {
            console.log('- no projects file');
        } else {
            let projectFile = Controller.readInformation(
                Controller.settings.reactLocation +
                    'src/Resources/projects.json',
                true
            );

            if (projectFile.deployments === undefined)
                projectFile.deployments = {};

            if (projectFile.deployments[deployInfo.project] === undefined)
                projectFile.deployments[deployInfo.project] = {};

            projectFile.deployments[deployInfo.project][deployInfo.chainId] =
                deployInfo;

            Controller.writeInformation(
                projectFile,
                Controller.settings.reactLocation +
                    'src/Resources/projects.json'
            );
        }

        Controller.log('- writing to dist folder');
        Controller.writeInformation(
            deployInfo,
            Controller.settings.reactLocation +
                'dist/' +
                deployInfo.project +
                '/' +
                deployInfo.chainId +
                '/' +
                'deployInfo.json'
        );
    },
};
module.exports = InfinityMintClient;
