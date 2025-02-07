<template>
  <div class="container bg-green-900/20 w-screen max-w-3xl mx-auto p-8">
    <h2 class="text-xl font-bold text-center mb-8 text-gray-200">Wallet Connect</h2>

    <!-- Input field for WalletConnect URI -->
    <div class="mb-6">
      <input v-model="walletUri" placeholder="Enter WalletConnect URI"
        class="p-4 rounded-lg w-full bg-white opacity-50 focus:outline-none focus:ring focus:ring-blue-400 text-gray-800 backdrop-blur-sm" />
    </div>

    <!-- Connect and Disconnect Buttons -->
    <div class="flex justify-center space-x-4 mb-8">
      <button @click="connectWithUri" :disabled="!walletUri"
        class="bg-blue-500 w-full text-white p-3 whitespace-nowrap rounded-lg hover:bg-blue-600 focus:outline-none disabled:bg-gray-500">
        Connect Wallet
      </button>
      <button @click="disconnectWallet" v-if="walletConnected"
        class="bg-red-500 text-white p-3 rounded-lg w-32 hover:bg-red-600 focus:outline-none">
        Disconnect
      </button>
    </div>

    <!-- Active Sessions List -->
    <div class="w-full max-w-xl mx-auto p-6 border relative rounded-lg shadow-lg bg-white mb-8">
      <h3 class="text-2xl font-semibold mb-4 text-blue-600">Active Sessions:</h3>
      <ul class="space-y-4 relative">
        <li v-for="(session, sessionId) in activeSessions" :key="sessionId" class="p-4 text-clip bg-gray-50 rounded-lg shadow-sm">
          <!-- Session ID -->
          <p class="text-sm font-mono max-w- font-medium text-blue-700">Session ID: {{ sessionId }}</p>

          <!-- Relay Protocol -->
          <p class="text-gray-700">
            <span class="font-semibold">Relay Protocol:</span> {{ session.relay.protocol }}
          </p>
          <!-- Disconnect Button -->
          <button @click="disconnectSession(session.topic)"
            class="bg-red-500 text-white p-2 rounded-lg mt-4 hover:bg-red-600 focus:outline-none">
            Disconnect Session
          </button>
        </li>
      </ul>
    </div>

    <!-- Display Error Messages -->
    <div v-if="errorMessage" class="mt-6 text-red-500 text-center">
      <span class="font-medium">Error:</span> {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';

// Initialize WalletConnect Core
const core = new Core({
  projectId: '4f88dfdcec8f22c4e7ea1368c35eba3b', // Replace with your actual project ID
});

const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'My Vue App',
    description: 'A Vue.js app with WalletConnect',
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
      activeSessions: [],
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
                'eip155:1:0x887b295ffE6CE717eF6F1496AbE818e0e84b1700',
                'eip155:137:0x887b295ffE6CE717eF6F1496AbE818e0e84b1700',
              ],
            },
          },
        });

        const session = await walletKit.approveSession({ id, namespaces: approvedNamespaces });
        this.updateSessionState(session);
      } catch (error) {
        console.error('Error during session proposal handling:', error);
        this.errorMessage = 'Session proposal rejected or error occurred.';
        await walletKit.rejectSession({ id: params.id, reason: getSdkError('USER_REJECTED') });
      }
    },

    async connectWithUri() {
      try {
        if (!this.walletUri) return;

        const session = await walletKit.pair({ uri: this.walletUri });
        this.getActiveSessions();

        this.updateSessionState(session);
      } catch (error) {
        console.error('Error connecting with URI:', error);
        this.errorMessage = 'Error while connecting with WalletConnect URI.';
      }
    },

    async disconnectWallet() {
      try {
        const activeSessions = walletKit.getActiveSessions();
        if (activeSessions.length > 0) {
          const session = activeSessions[0];
          await walletKit.disconnectSession({ topic: session.topic });
        }

        this.resetSessionState();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    },

    async disconnectSession(topic) {
      try {
        await walletKit.disconnectSession({ topic });
        this.getActiveSessions(); // Refresh the active sessions list
      } catch (error) {
        console.error('Error disconnecting session:', error);
      }
    },

    async getActiveSessions() {
      try {
        this.activeSessions = walletKit.getActiveSessions();
      } catch (error) {
        console.error('Error getting active sessions:', error);
      }
    },

    updateSessionState(session) {
      if (session) {
        this.walletAddress = session.accounts ? session.accounts[0] : null;
        this.namespace = session.namespaces;
        this.walletConnected = true;
        this.session = session;
        this.errorMessage = null;
      } else {
        this.errorMessage = 'Failed to establish session.';
      }
    },

    resetSessionState() {
      this.walletConnected = false;
      this.walletAddress = null;
      this.session = null;
      this.namespace = null;
    }
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
</style>
