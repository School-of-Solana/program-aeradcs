import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const WalletConnect = () => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <WalletMultiButton
        style={{
          backgroundColor: "#512da8",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "0.375rem",
          border: "none",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
      />
    </div>
  );
};
