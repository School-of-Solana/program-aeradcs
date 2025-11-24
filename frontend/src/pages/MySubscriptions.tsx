import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../utils/anchorSetup";
import { getCreatorProfilePda, getSubscriptionPda } from "../utils/helpers";
import { lamportsToSol, formatDate, truncateAddress } from "../utils/constants";

interface SubscriptionData {
  publicKey: PublicKey;
  account: {
    subscriber: PublicKey;
    creator: PublicKey;
    planId: BN;
    expiresAt: BN;
    createdAt: BN;
  };
}

interface SubscriptionWithPlan {
  subscription: SubscriptionData["account"];
  plan: {
    creator: PublicKey;
    planId: BN;
    name: string;
    price: BN;
    durationDays: number;
    createdAt: BN;
  };
  isActive: boolean;
}

export const MySubscriptions = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMySubscriptions = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (!signTransaction || !signAllTransactions) {
          setError("Wallet does not support required signing methods");
          setLoading(false);
          return;
        }

        const wallet = {
          publicKey,
          signTransaction,
          signAllTransactions,
        };

        const { program } = getProgram(wallet);

        const allSubscriptions = await program.account.subscription.all();

        const userSubscriptions = allSubscriptions.filter((sub) =>
          sub.account.subscriber.equals(publicKey)
        );

        const subscriptionsWithPlans = await Promise.all(
          userSubscriptions.map(async (sub) => {
            const [creatorProfilePda] = getCreatorProfilePda(
              sub.account.creator,
              sub.account.planId
            );

            const creatorProfile = await program.account.creatorProfile.fetch(
              creatorProfilePda
            );

            const [subscriptionPda] = getSubscriptionPda(
              sub.account.subscriber,
              sub.account.creator,
              sub.account.planId
            );

            let isActive = false;
            try {
              isActive = await program.methods
                .checkSubscription()
                .accountsPartial({
                  subscription: subscriptionPda,
                })
                .view();
            } catch (err) {
              isActive = false;
            }

            return {
              subscription: sub.account,
              plan: creatorProfile,
              isActive,
            };
          })
        );

        setSubscriptions(subscriptionsWithPlans as SubscriptionWithPlan[]);
      } catch (err) {
        setError("Failed to load your subscriptions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMySubscriptions();
  }, [publicKey, signTransaction, signAllTransactions]);

  if (!publicKey) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          My Subscriptions
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          View all your active and expired subscriptions
        </p>

        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          My Subscriptions
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          View all your active and expired subscriptions
        </p>

        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ color: "#6b7280", textAlign: "center" }}>
            Loading your subscriptions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#111827",
          marginBottom: "1rem",
        }}
      >
        My Subscriptions
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        View all your active and expired subscriptions
      </p>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "0.375rem",
            marginBottom: "1rem",
          }}
        >
          <p style={{ color: "#991b1b", fontSize: "0.875rem", margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
            You don't have any subscriptions yet. Browse the Marketplace to
            subscribe to plans.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {subscriptions.map((item, index) => {
            return (
              <div
                key={`${item.subscription.creator.toBase58()}-${item.subscription.planId.toString()}-${index}`}
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    {item.plan.name}
                  </h3>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      backgroundColor: item.isActive ? "#d1fae5" : "#fee2e2",
                      color: item.isActive ? "#065f46" : "#991b1b",
                    }}
                  >
                    {item.isActive ? "Active" : "Expired"}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Creator:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {truncateAddress(item.subscription.creator.toBase58())}
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Price Paid:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        fontWeight: "600",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {lamportsToSol(item.plan.price.toNumber())} SOL
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Duration:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {item.plan.durationDays} days
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Started:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {formatDate(item.subscription.createdAt.toNumber())}
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Expires:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {formatDate(item.subscription.expiresAt.toNumber())}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
