import React from 'react';
import { send } from './classic/helpers';

send('InfinityMint', 'mint', [], {
    gasLimit: 1000000,
});
function App() {
    return <h1>Hi</h1>;
}

export default App;
