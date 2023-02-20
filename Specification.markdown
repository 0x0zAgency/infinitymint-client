# Commit Message Specifications

Commit messages should be clear, concise and describe _exactly_ what the commit _achieves_.
Do not describe _how_ or _why_ your commit works, or simply that something does; this leads to extremely confusing commit histories and will make pull requests a lot more difficult.

For example;

📛 **Bad Commit**

> "React now works!"

> "Alert boxes work because of `sweetalert` package"

😊 **Good Commits**

> Fix: Navbar alignment no longer clips outside of viewport

> Feat: Added avatars to `Team` component

## Commit types

You may notice that the "good" commits are always prefixed with a key-phrase: this denotes what _type_ of commit you are wanting to push. This is done for much easier debugging and versioning for previous commits, making reverts to older versions a lot simpler, rather than navigating through commits labeled...

> f

These are not a guideline, but a set of uniform types that **must** be followed in **every** commit.

-   **Fix** - For denoting a fix (not a patch) to current existing features.

-   **Patch** - Patch is used when a fix is applied to a previous fix.

-   **Feature** - Feature is used new things are added into InfinityMint.

-   **Update** - Specifically used for any updates to either notes or documentation.

-   **Refactor** - Refactor is used when things are removed or reprogrammed for better efficiently inside InfinityMint.

-   **Deprecation** - Deprecation is used when preparing to remove things in InfinityMint.

-   **Removal** - Removal is used in the removal of deprecated methods.

Happy versioning 💯 🔥

---

###### Kae & Lyds \_ 2023
