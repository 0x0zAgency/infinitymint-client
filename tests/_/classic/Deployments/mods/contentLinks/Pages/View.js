import React, { PureComponent } from "react";
import Controller from "infinitymint-client/dist/src/classic/controller";

class View extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            project: {},
            loaded: false,
        };
    }

    async componentDidMount() {
        const currentProject = Controller.getProjectSettings();
    }

    render() {
        return <div>edit</div>;
    }
}

View.url = "/admin/content";
View.id = "View";
View.requirements = {
    requireAdmin: true,
    requireWallet: true,
};

export default View;
