/**
 * The strings! You can call these in the wild by
 *  import Resources from "./resources" //do not import Resources.$
 *
 *  console.log(Resources.$.UI.Action.CreateToken)
 *
 *  or if you are in JSX
 *
 *  <>
 *   {Resources.$.UI.Action.CreateToken}
 *  </>
 *
 * Uses some speical keys to do stuff
 *
 * %token% - the name of the token
 * %tokenCapitalized% - the name of the token Capitalized
 * %tokens% - the plural name for the tokens
 * %tokensCapitalized% - the Capitalized plural name for the tokens
 *
 * \\! - an s will be added to the plural variant of this key, but not if it is not plural
 *
 * Creating your own:-
 *
 *  The easiest way to do that is to copy and paste thiile, give it a neat name and then change resources key inside of Config.js to point to
 *  your new file.
 */

const Content = {
    UI: {
        Responses: {
            Success: '🤠 Success\\g',
            Failure: '😭 Failure\\!',
            Error: '😢 Error\\!',
        },
        Action: {
            CreateToken: '🎫 Buy %tokenCapitalized%',
            RedeemToken: '🎟 Redeem %tokenCapitalized% CD-key',
            CreateSticker: '🗂️ Create Sponsorship\\!',
            PlaceSticker: '🤏 Place Sponsor',
            SelectSticker: '✅ Select Sponsor',
            FindSticker: '🔍 Search Sponsorships',
            PickSticker: '☝🏽 Pick Sponsor',
            PreviewSticker: '👁️ Preview Sponsor',
            Overview: '🗺 Overview',
            InspectSticker: '👀 Inspect Sponsorship',
            AddSticker: '💸 Add Sponsor',
            AllToken: '🌠 All %tokenCapitalized%',
            TopToken: '🌠 Top %tokenCapitalized%',
            StickerControlCenter: '🌎 EADS.eth Control Center\\!',
            MyToken: '🔍 My %tokenCapitalized%',
            EditToken: '✏️ Edit %tokenCapitalized%',
            CustomToken: '✨ Custom %tokenCapitalized%',
            MySticker: '🗒️ My Sticker\\!', // Because of \\! will produce the result of My Stickers at Resources.$.Action.MySticker_Plural
            InspectToken: '👀 Inspect %tokenCapitalized%',
            Inspect: '👀 Inspect',
            Preview: '🔮 Preview',
            SelectToken: '☑️ Select %tokenCapitalized%',
            FindToken: '🔍 Select %tokenCapitalized%',
            FetchResult: '🔍 Fetch Result\\!',
            PickToken: '☝🏽 Pick A %tokenCapitalized%',
            MintToken: '🔮 Random %tokenCapitalized%',
            SelectiveMint: '☝🏽 Choose Your %tokenCapitalized%',
            BackToToken: '↩️ Back To %tokenCapitalized%',
            GotoToken: '↪️ Goto %tokenCapitalized%',
            Goto: '↪️ Goto',
            Go: '↪️ Go',
            Refresh: '🔃 Refresh',
            NavigateToToken: '🔼 Sail To %tokenCapitalized%',
            ToTop: '⏫ Top',
            PreviewMint: '☁️ Preview Pass Covers',
            PreviewToken: '☁️ Preview %tokenCapitalized%',
            Generic: '✅ Go',
            Submit: '✅ Submit',
            Accept: '✅ Accept',
            Save: '💾 Save',
            FinalizeSticker: '✅ Finalize Sponsorship',
            Select: '👍 Select',
            Unselect: '✖️ Unselect',
            Cancel: '✖️ Cancel',
            Search: '🔍 Search\\?',
            Apply: '👍 Apply',
            Close: '✖️ Close',
            Delete: '💣 Delete',
            DeletePreview: '🗑️ Delete Preview',
            Change: '♻️ Change',
            Reset: '⎌ Reset',
            Back: '↩️ Back',
            Back_Plural: '↩️ Back',
            Revert: '⎌ Revert',
            Reject: '❌ Reject',
            DeleteSticker: '❌ Delete Sticker',
            Withdraw: '🏦 Withdraw Funds',
            Edit: '✏️ Edit\\!',
            EditMetadata: '✏️ Edit Metadata',
            EditMetadata_Plural: '✏️ Edit Metadata',
            EditColour: '🎨 Edit Colour',
            EditColor: '🎨 Edit Color',
            EditApperance: '🎨 Edit Apperance',
            Download: '💾 Download\\!',
            Load: '💿 Load',
            Advertise: '🚀 Advertise or Sponsor',
            ViewToken: '🔍 View %tokenCapitalized%',
            TransferToken: '✈️ Transfer %tokenCapitalized%',
            AddToken: '➕ Add %tokenCapitalized%',
            ViewSticker: '🔍 View Sponsor\\!',
            View: '🧐 View',
            PlaceOffer: '💸 Place Offer\\!',
            SendOffer: '💸 Send Offer\\!',
            DownloadSticker: '💾 Download Sticker',
            LoadSticker: '💿 Load Sticker',
            LoadToken: '💿 Load %tokenCapitalized%',
            RevertSticker: '⎌ Reset Sticker',
            ConnectWallet: '🌎 Connect',
            ConnectWallet_Plural: '🌎 Connect',
        },
        Symbols: {
            Delete: '💣',
            View: '🔍',
            Colours: '🎨',
            Ready: '👍',
        },
        Misc: {
            Statistic: '📈 Statistic\\!',
            Support: '❓ Support\\!',
            Transaction: '💱 Transaction\\!',
            Setting: '⚙️ Setting\\!',
            YourToken: '🎫 Your Ticket\\!',
        },
        Navbar: {
            InfinityMint: '📈 InfinityMint',
            Code: '🎓 Documentation',
            Team: '🎩 Authors',
            Mint: '➕ %tokenCapitalized%',
            Home: '🧳 Home\\!',
            Gallery: '🕶 Attendees',
            Gallery_Plural: '🧐 Galleries',
            Preview: '📤 Preview\\!',
            Utility: '🔧',
            Utility_Plural: 'Utilities',
            User: '%tokenCapitalized%',
            Users: '%tokensCapitalized%',
            Tool: '🔧 Tool\\!',
            Stickers: '💎 EADS.eth',
            Admin: '🛡️',
            Gem: 'Gem\\!',
            AdminMint: '🎫 Mint\\!',
            AdminGem: '💎 Gem\\!',
            AdminENSRedirect: 'ENS Redirect\\!',
            AdminRoyalty: 'Profits',
            AdminIPFS: 'IPFS',
            AdminUpdate: '🎫 Update Project',
            AdminAuthentication: '📤 Authenticate',
            AdminModules: '💿 Modules',
            AdminRoyalty_Plural: 'Royalties',
            ProjectSetting: '⚙️ Project Setting\\!',
            ProjectEditor: '✨ Project Editor\\!',
            DeveloperSetting: '🤖 Dev Setting\\!',
            Options: '⚙️ Options\\!',
            Status: '🤖 Status\\!',
            Path_Editor: '✏️ Path Editor\\!',
            TinySVGToSVG: 'tinySVG ➡️ SVG',
            SVGToTinySVG: 'SVG ➡️ tinySVG',
            SelectiveMint: '⛏️ Selective Mint',
        },
    },
    // NOTE: Further detail might be inside of the pages them selves such as paragraphs and the such
    Pages: {
        Gallery: {
            PageTitle: 'Gallery',
            Title: 'Gallery',
            SubTitle: 'All of the %tokens%!',
            Description: '',
        },
        Index: {
            PageTitle: 'Index',
            Title: 'Awedacity Conference Ticket Minter',
            SubTitle: '',
            Description: '',
        },
        MyTokens: {
            PageTitle: 'My Tickets',
            Title: 'My %tokensCapitalized%',
            SubTitle: '',
            Description: '',
        },
        Mint: {
            PageTitle: 'Buy a ticket',
            Title: 'Buy a ticket',
            SubTitle: 'Here you can mint an %tokenCapitalized%.',
            Description: '',
        },
    },
};

export default Content;
