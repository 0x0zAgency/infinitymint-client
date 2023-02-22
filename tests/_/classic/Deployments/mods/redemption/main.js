import Config from "../../../config";
import Controller from "infinitymint-client/dist/src/classic/controller";
import { Button, Card } from "react-bootstrap";
import { getLink, hasLinkKey } from "../../../helpers";

const RedemptionTools = {
    onCheckLink: async ({ link, token }) => {
        if (
            link !== "proof_of_redemption" ||
            hasLinkKey(token, "proof_of_redemption")
        )
            return;

        //check the linker contract here to see if tokenId has a minter
        let result;
        try {
            result = await Controller.callMethod(
                Controller.accounts[0],
                "Mod_RedemptionLinker",
                "canGetProofOfRedemption",
                [token.tokenId]
            );
        } catch (error) {
            console.log(error);
            throw new Error(
                "Sorry! A Mysterious error is preventing this from happening."
            );
        }

        if (!result)
            throw new Error(
                "You've either already claimed your proof of redemption or you aren't entitled!"
            );

        return "🤩 Your free NFT is redeemable or has been redeemed!";
    },

    getViewTokenSidebarChildren: ({ token }) => {
        if (!hasLinkKey(token, "proof_of_redemption")) return <></>;

        return (
            <>
                <Card body className="bg-light">
                    <div className="d-grid">
                        <p className="text-center display-5">🔑 Redeemed</p>
                        <Button
                            variant="primary"
                            onClick={() => {
                                window.open(
                                    Config.getNetwork().openseaAssets +
                                        token.destinations[
                                            getLink(
                                                token,
                                                "proof_of_redemption"
                                            ).index
                                        ] +
                                        "/" +
                                        token.tokenId
                                );
                            }}
                        >
                            View Proof Of Redemption
                        </Button>
                    </div>
                </Card>
            </>
        );
    },

    onLinkSuccess: ({ link, token, linkObject }) => {
        return (
            <div className="d-grid mb-2">
                <Button
                    variant="success"
                    onClick={() => {
                        window.open(
                            Config.getNetwork().openseaAssets +
                                token.destinations[
                                    getLink(token, "proof_of_redemption").index
                                ] +
                                "/" +
                                token.tokenId
                        );
                    }}
                >
                    View Proof Of Redemption
                </Button>
            </div>
        );
    },

    /**
     *
     * @param {Controller} param0
     */
    initialize: async () => {
        let deployment = Config.getDeployment("Mod_Redemption");
        Controller.initializeContract(
            deployment.address,
            "Mod_Redemption",
            true
        );

        deployment = Config.getDeployment("Mod_RedemptionLinker");
        Controller.initializeContract(
            deployment.address,
            "Mod_RedemptionLinker",
            true
        );
    },
};

export default RedemptionTools;
