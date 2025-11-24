import { Program, AnchorProvider } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/subscriptions_dapp.json";
import type { SubscriptionsDapp } from "../types/subscriptions_dapp";

export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID);
export const RPC_URL = import.meta.env.VITE_RPC_URL;

export function getProgram(wallet?: AnchorWallet) {
  const connection = new Connection(RPC_URL, "confirmed");

  if (!wallet) {
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    } as AnchorWallet;

    const provider = new AnchorProvider(connection, dummyWallet, {
      commitment: "confirmed",
    });

    const program = new Program<SubscriptionsDapp>(idl as Idl, provider);
    return { program, connection, provider };
  }

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program<SubscriptionsDapp>(idl as Idl, provider);

  return { program, connection, provider };
}
