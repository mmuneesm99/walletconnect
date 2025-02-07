<template>
  <div class="container bg-green-900/20 w-screen max-w-lg mx-auto p-8">
    <h2 class="text-xl font-bold text-center mb-8 text-gray-200">Wallet Connect</h2>
    
    <!-- Input field for WalletConnect URI -->
    <div class="mb-6">
      <input v-model="walletUri" placeholder="Enter WalletConnect URI" class="p-4 rounded-lg w-full bg-white opacity-50 focus:outline-none focus:ring focus:ring-blue-400 text-gray-800 backdrop-blur-sm" />
    </div>
    
    <!-- Connect and Disconnect Buttons -->
    <div class="flex justify-center space-x-4 mb-8">
      <button @click="connectWithUri" :disabled="!walletUri" class="bg-blue-500 w-full text-white p-3 whitespace-nowrap rounded-lg hover:bg-blue-600 focus:outline-none disabled:bg-gray-500">
        Connect Wallet
      </button>
      <button @click="disconnectWallet" v-if="walletConnected" class="bg-red-500 text-white p-3 rounded-lg w-32 hover:bg-red-600 focus:outline-none">
        Disconnect
      </button>
    </div>
    
    <!-- Display Wallet Info -->
    <div v-if="walletConnected" class="w-full max-w-lg mx-auto p-6 border rounded-lg shadow-lg bg-white">
      <h3 class="text-2xl font-semibold mb-4 text-blue-600">Wallet Details:</h3>
      <p><strong>Wallet Address:</strong> <span class="text-blue-600">{{ walletAddress }}</span></p>
      <p><strong>Namespace:</strong> <span class="text-gray-700">{{ namespace }}</span></p>
      <p><strong>Session Details:</strong></p>
      <!-- <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto">{{ sessionDetails }}</pre> -->
    </div>
    
    <!-- Display Error Messages -->
    <div v-if="errorMessage" class="mt-6 text-red-500 text-center">
      <strong>Error:</strong> {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';

const core = new Core({
  projectId: '4f88dfdcec8f22c4e7ea1368c35eba3b', // Replace with your actual project ID
});

const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'My Vue App',
    description: 'A Vue.js app with manual WalletConnect URI',
    url: 'https://my-vue-app.com',
    icons: [],
  },
});

export default {
  data() {
    return {
      walletUri: '',
      walletConnected: false,
      walletAddress: null,
      session: null,
      namespace: null,
      errorMessage: null,
    };
  },
  computed: {
    sessionDetails() {
      return this.session ? JSON.stringify(this.session, null, 2) : 'No session details available';
    },
  },
  methods: {
    async onSessionProposal({ id, params }) {
      try {
        const approvedNamespaces = buildApprovedNamespaces({
          proposal: params,
          supportedNamespaces: {
            eip155: {
              chains: ['eip155:1', 'eip155:137'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: ['accountsChanged', 'chainChanged'],
              accounts: [
                'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
                'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
              ],
            },
          },
        });

        const session = await walletKit.approveSession({ id, namespaces: approvedNamespaces });
        console.log('Approved session:', session);
        
        if (session) {
          this.walletAddress = session.accounts ? session.accounts[0] : null;
          this.namespace = session.namespaces;
          this.walletConnected = true;
          this.session = session;
          this.errorMessage = null;
        }
      } catch (error) {
        console.error('Error during session proposal handling:', error.message);
        this.errorMessage = 'Session proposal rejected or error occurred.';
        await walletKit.rejectSession({ id: params.id, reason: getSdkError('USER_REJECTED') });
      }
    },
    async connectWithUri() {
      try {
        if (!this.walletUri) return;

        const session = await walletKit.pair({ uri: this.walletUri });

        if (session) {
          this.walletAddress = session.accounts ? session.accounts[0] : null;
          this.namespace = session.namespaces;
          this.walletConnected = true;
          this.session = session;
          this.errorMessage = null;
        } else {
          this.errorMessage = 'Failed to establish session.';
        }
      } catch (error) {
        console.error('Error connecting with URI:', error.message);
        this.errorMessage = 'Error while connecting with WalletConnect URI.';
      }
    },
    async disconnectWallet() {
      try {
        const activeSessions = walletKit.getActiveSessions();
        if (activeSessions.length > 0) {
          const session = activeSessions[0];
          await walletKit.disconnect({ topic: session.topic });
        }

        this.walletConnected = false;
        this.walletAddress = null;
        this.session = null;
        this.namespace = null;
      } catch (error) {
        console.error('Error disconnecting:', error.message);
      }
    },
    async getActiveSessions() {
      try {
        const activeSessions = walletKit.getActiveSessions();
        console.log('Active sessions:', activeSessions);
      } catch (error) {
        console.error('Error getting active sessions:', error.message);
      }
    },
  },
  created() {
    walletKit.on('session_proposal', this.onSessionProposal);
    this.getActiveSessions();
  },
};
</script>

<style scoped>
.container {
  margin: auto;
  padding: 20px;
  text-align: center;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

pre {
  background-color: #f7f7f7;
  padding: 10px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>