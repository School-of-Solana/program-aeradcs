import { useMemo, useEffect } from "react";
import type { FC, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    const rpcUrl = import.meta.env.VITE_RPC_URL;
    console.log("🔌 RPC URL:", rpcUrl);
    return rpcUrl || clusterApiUrl("devnet");
  }, []);

  const wallets = useMemo(() => {
    console.log(
      "💼 Initializing wallets array with Phantom (triggers auto-detection)"
    );
    return [new PhantomWalletAdapter()];
  }, []);

  useEffect(() => {
    console.log("🔍 Checking for Solana wallets in window object...");
    console.log("Window.solana:", window.solana);
    console.log(
      "Window.backpack:",
      (window as unknown as Record<string, unknown>).backpack
    );
    console.log(
      "Window.phantom:",
      (window as unknown as Record<string, unknown>).phantom
    );

    setTimeout(() => {
      console.log("⏰ After 1 second delay:");
      console.log("Window.solana:", window.solana);
      console.log(
        "Window.backpack:",
        (window as unknown as Record<string, unknown>).backpack
      );
      console.log(
        "Window.phantom:",
        (window as unknown as Record<string, unknown>).phantom
      );
    }, 1000);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
