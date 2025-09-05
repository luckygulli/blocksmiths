import { ethers } from "ethers";

// Define the structure of a position
export interface Position {
  x: number;
  y: number;
  initialized: boolean;
}

export class Board {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, abi: any, signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, abi, signer);
    this.signer = signer;
  }

  /** Initialize a player's position */
  async initPosition(x: number, y: number): Promise<void> {
    const tx = await this.contract.connect(this.signer).initPosition(x, y);
    await tx.wait();
  }

  /** Move player to a new position (must be exactly distance 1) */
  async move(newX: number, newY: number): Promise<void> {
    const tx = await this.contract.connect(this.signer).move(newX, newY);
    await tx.wait();
  }

  /** Get a player's current position */
  async getPosition(playerAddress: string): Promise<{ x: number; y: number }> {
    const [x, y] = await this.contract.getPosition(playerAddress);
    return { x: x.toNumber(), y: y.toNumber() };
  }
}
