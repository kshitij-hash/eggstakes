import { ethers } from 'ethers';
import contractABI from '../game/contract.json';

// Contract address from your request
const CONTRACT_ADDRESS = '0x29B1973a8684103a74cDf68CD5f20851f857aa2a';

// Default bet amount as defined in the contract (0.001 ETH)
const DEFAULT_BET_AMOUNT = "0.001";

// Enum values for Hen type (based on the contract)
export enum Hen {
  A = 0,
  B = 1
}

export class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;
  
  constructor() {
    this.initializeEthers();
  }

  private async initializeEthers() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Create ethers provider
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get signer
        this.signer = await this.provider.getSigner();
        
        // Create contract instance
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          this.signer
        );
      } catch (error) {
        console.error('Failed to initialize ethers:', error);
      }
    } else {
      console.warn('No ethereum provider found. Please install a wallet.');
    }
  }

  // Reinitialize if wallet changes
  public async reconnect() {
    await this.initializeEthers();
  }

  // Get the bet amount required by the contract
  public async getBetAmount(): Promise<bigint> {
    if (!this.contract) await this.initializeEthers();
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      // BET_AMOUNT is a public constant in the contract
      const betAmount = await this.contract.BET_AMOUNT();
      return betAmount;
    } catch (error) {
      console.warn('Could not get BET_AMOUNT from contract, using default value:', error);
      // Fallback to the default value defined in the contract
      return ethers.parseEther(DEFAULT_BET_AMOUNT);
    }
  }

  // Start a new round
  public async startRound(durationSeconds: number): Promise<ethers.TransactionResponse> {
    if (!this.contract) await this.initializeEthers();
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Wallet not connected');

    try {
      console.log('Starting a new round...');
      const tx = await this.contract.startRound(durationSeconds); 
      console.log('Start round transaction sent:', tx.hash);
      await tx.wait(); // Wait for the transaction to be mined
      console.log('Start round transaction confirmed.');
      return tx;
    } catch (error) {
      console.error('Error starting round:', error);
      throw error;
    }
  }

  // End the current round
  public async endRound(winner: Hen): Promise<ethers.TransactionResponse> {
    if (!this.contract) await this.initializeEthers();
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Wallet not connected');

    try {
      console.log(`Ending the current round, declaring winner: ${Hen[winner]}...`);
      const tx = await this.contract.endRound(winner);
      console.log('End round transaction sent:', tx.hash);
      await tx.wait(); // Wait for the transaction to be mined
      console.log('End round transaction confirmed.');
      return tx;
    } catch (error) {
      console.error('Error ending round:', error);
      throw error;
    }
  }

  // Place a bet on a hen
  public async placeBet(hen: Hen): Promise<ethers.TransactionResponse> {
    if (!this.contract) await this.initializeEthers();
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Wallet not connected');
    
    try {
      const betAmount = await this.getBetAmount();
      console.log(`Placing bet on Hen ${hen} with amount ${ethers.formatEther(betAmount)} ETH`);
      
      // Call the placeBet function with the selected hen and bet amount
      // Make sure we're passing the correct parameters as expected by the contract
      const tx = await this.contract.placeBet(hen, {
        value: betAmount
      });
      
      console.log('Transaction sent:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  // Get all players
  public async getPlayers(): Promise<string[]> {
    if (!this.contract) await this.initializeEthers();
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.getPlayers();
    } catch (error) {
      console.error('Error getting players:', error);
      throw error;
    }
  }

}

// Create a singleton instance
export const contractService = new ContractService();
