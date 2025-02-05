<template>
  <div>
    <!-- QR Code Display -->
    <div v-if="qrCodeUri" class="qr-code">
      <img :src="qrCodeUri" alt="QR Code for WalletConnect" />
    </div>

    <!-- Input for Manually Entering Wallet URI -->
    <div v-if="!connected">
      <input 
        v-model="walletUri" 
        placeholder="Enter WalletConnect URI" 
        type="text" 
        class="wallet-uri-input" 
      />
      <button @click="connectWallet">Connect Wallet</button>
    </div>

    <!-- Disconnect Wallet Button -->
    <div v-if="connected">
      <button @click="disconnectWallet">Disconnect Wallet</button>
    </div>

    <!-- Display Wallet Address -->
    <div v-if="walletAddress">
      Connected to: {{ walletAddress }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

export default {
  setup() {
    const walletKit = ref(null);
    const connected = ref(false);
    const walletAddress = ref(null);
    const qrCodeUri = ref(null);
    const walletUri = ref('');  // Store the URI entered by the user

    // Initialize WalletKit on mounted
    onMounted(async () => {
      const core = new Core({
        projectId: '4f88dfdcec8f22c4e7ea1368c35eba3b', // Replace with your WalletConnect projectId
      });

      walletKit.value = await WalletKit.init({
        core
      });

      // Listen for session proposal
      walletKit.value.on('session_proposal', (proposal) => {
        console.log('Session proposal received:', proposal);
        if (!proposal.params || !proposal.uri) {
          console.error('Malformed session proposal:', proposal);
          return;
        }
        qrCodeUri.value = proposal.uri; // Set the QR code URI to display it
      });
    });

    // Connect to Wallet
    const connectWallet = async () => {
      const uri = typeof walletUri.value === 'string' ? walletUri.value.trim() : '';

      if (!uri || !uri.startsWith('wc:')) {
        console.error('Please enter a valid WalletConnect URI');
        return;
      }

      try {
        await walletKit.value.pair({ uri });

        walletKit.value.on('session_connected', (session) => {
          console.log('Session connected:', session);
          if (!session.accounts || session.accounts.length === 0) {
            console.error('No accounts found in the session.');
            return;
          }
          connected.value = true;
          walletAddress.value = session.accounts[0];
        });
      } catch (error) {
        console.error('Connection failed:', error);
      }
    };

    // Disconnect the wallet
    const disconnectWallet = async () => {
      await walletKit.value.disconnect();
      connected.value = false;
      walletAddress.value = null;
      qrCodeUri.value = null;
      console.log('Wallet disconnected');
    };

    return {
      walletUri,
      qrCodeUri,
      connected,
      walletAddress,
      connectWallet,
      disconnectWallet,
    };
  },
};
</script>

<style scoped>
.qr-code {
  margin: 20px;
  text-align: center;
}

.wallet-uri-input {
  padding: 10px;
  margin-top: 20px;
  width: 300px;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

div {
  text-align: center;
}
</style>
