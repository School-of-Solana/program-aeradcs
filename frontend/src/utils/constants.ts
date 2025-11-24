export const LAMPORTS_PER_SOL = 1_000_000_000;

export const truncateAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};
