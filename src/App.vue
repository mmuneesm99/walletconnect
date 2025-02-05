<template>
  <div>
    <!-- QR Code Display -->
    <!-- <div v-if="qrCodeUri" class="qr-code">
      <p>Scan the QR code to connect:</p>
      <img :src="generateQrCode(qrCodeUri)" alt="QR Code for WalletConnect" />
    </div> -->

    <!-- Input for Manually Entering Wallet URI -->
    <div v-if="!connected">
      <input v-model="walletUri" placeholder="Enter WalletConnect URI" type="text" />
      <button :disabled="!walletUri.trim()" @click="connectWallet">Connect Wallet</button>
      <p v-if="showError" class="error">Please enter a valid WalletConnect URI</p>

    </div>

    <!-- Disconnect Wallet Button -->
    <div v-if="connected">
      <p>Connected to: {{ walletAddress }}</p>
      <button @click="disconnectWallet">Disconnect Wallet</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
// import QRCode from 'qrcode';

export default {
  setup() {
    const walletKit = ref(null);
    const connected = ref(false);
    const walletAddress = ref(null);
    const qrCodeUri = ref(null);
    const walletUri = ref('');

    // Generate a QR code from the URI
    // const generateQrCode = async (uri) => {
    //   try {
    //     return await QRCode.toDataURL(uri);
    //   } catch (error) {
    //     console.error('Error generating QR code:', error);
    //     return '';
    //   }
    // };

    onMounted(async () => {
      try {
        const core = new Core({
          projectId: '4f88dfdcec8f22c4e7ea1368c35eba3b',
          verify: false,
        });

        walletKit.value = await WalletKit.init({
          core,
          metadata: {
            name: 'My Dapp',
            description: 'My Dapp Description',
            url: 'https://your-dapp.com',
            icons: ['https://your-icon.com'],
          },
        });

        walletKit.value.on('session_proposal', (proposal) => {
          console.log('Session proposal received:', proposal);
          if (!proposal.params || !proposal.uri) {
            console.error('Malformed session proposal:', proposal);
            return;
          }
          // qrCodeUri.value = proposal.uri;
        });

        walletKit.value.on('session_connected', (session) => {
          connected.value = true;
          walletAddress.value = session.accounts[0];
        });

        walletKit.value.on('session_error', (error) => {
          console.error('Session error:', error);
        });
      } catch (error) {
        console.error('Error initializing WalletKit:', error);
      }
    });

    const connectWallet = async () => {
  try {
    if (walletUri.value.startsWith('wc:') && walletUri.value.includes('@2')) {
      console.log('Attempting to connect with URI:', walletUri.value);
      await walletKit.value.pair({ uri: walletUri.value.trim() });
    } else {
      console.error('Invalid WalletConnect URI format.');
    }
  } catch (error) {
    console.error('Connection failed:', error);
  }
};


    const disconnectWallet = async () => {
      try {
        await walletKit.value.disconnect();
        connected.value = false;
        walletAddress.value = null;
        qrCodeUri.value = null;
        console.log('Wallet disconnected');
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    };

    return {
      walletUri,
      qrCodeUri,
      connected,
      walletAddress,
      connectWallet,
      disconnectWallet,
      // generateQrCode,
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

p {
  font-size: 18px;
  font-weight: bold;
}
</style>
