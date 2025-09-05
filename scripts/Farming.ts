import { ethers } from "ethers";

export interface ResourcePosition {
    resourceId: string;
    x: number;
    y: number;
}

export class Farming {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, abi: any, signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, abi, signer);
    this.signer = signer;
  }

  async getResourcePositions(): Promise<ResourcePosition[]> {
    const positions = await this.contract.connect(this.signer).getResourcePositions();
    return positions;
  }

  async farm(resourceId: string, x: number, y: number): Promise<void> {
    const tx = await this.contract.connect(this.signer).farm(resourceId, x, y);
    await tx.wait();
  }
}
