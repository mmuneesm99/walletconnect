import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

// Initialize WalletConnect Core
const core = new Core({
  projectId: '4f88dfdcec8f22c4e7ea1368c35eba3b', // Replace with your actual project ID
});

// Initialize WalletKit
const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'My Vue App',
    description: 'A Vue.js app with manual WalletConnect URI',
    url: 'https://my-vue-app.com',
    icons: [],
  },
});

export default walletKit;
