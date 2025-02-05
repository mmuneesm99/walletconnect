import { ReovonWalletKit } from '@reovon/walletkit';
import { ethers } from 'ethers';
import QRCode from 'qrcode';

let walletKitInstance = null;

export async function initializeWalletKit(projectId) {
  try {
    // Initialize Reovon WalletKit
    walletKitInstance = new ReovonWalletKit({
      projectId, // Your projectId from Reovon
      chains: [1], // Ethereum mainnet or any other chain
      metadata: {
        name: 'My App Wallet',
        description: 'Wallet connection for MyApp',
        url: 'https://mywebsite.com',
        icons: ['https://avatars.mywebsite.com/'],
      },
    });

    await walletKitInstance.initialize();
    console.log('Reovon WalletKit Initialized');
  } catch (error) {
    console.error('Error initializing Reovon WalletKit:', error);
  }
}

export function getWalletKitInstance() {
  if (!walletKitInstance) throw new Error('Reovon WalletKit is not initialized');
  return walletKitInstance;
}

// Generate QR Code URL for wallet connection
export async function generateWalletConnectQR(walletConnectURL) {
  try {
    const qrCode = await QRCode.toDataURL(walletConnectURL);
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}
