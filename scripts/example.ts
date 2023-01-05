import type { InfinityMintScript } from "@app/interfaces";

const script: InfinityMintScript = {
  name: "My Example Script",
  description:
    "This is an example of how you can create a custom InfinityMint script",
  async execute(IM) {
    IM.log("Hello World");
  },
};
export default script;
