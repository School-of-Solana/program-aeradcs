import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../utils/anchorSetup";
import { getCreatorProfilePda, getSubscriptionPda } from "../utils/helpers";
import { lamportsToSol, truncateAddress } from "../utils/constants";

interface PlanData {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    planId: BN;
    name: string;
    price: BN;
    durationDays: number;
    createdAt: BN;
  };
}

export const Marketplace = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    Record<string, boolean>
  >({});

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      // Create wallet object if connected, otherwise undefined for read-only mode
      const wallet =
        publicKey && signTransaction && signAllTransactions
          ? { publicKey, signTransaction, signAllTransactions }
          : undefined;

      // getProgram works with or without wallet (read-only mode)
      const { program } = getProgram(wallet);

      // Fetch all plans (works with or without wallet)
      const allPlans = await program.account.creatorProfile.all();
      setPlans(allPlans as PlanData[]);

      // Only check subscription status if wallet is connected
      if (publicKey && wallet) {
        const statusMap: Record<string, boolean> = {};
        for (const plan of allPlans) {
          const key = `${plan.account.creator.toBase58()}-${plan.account.planId.toString()}`;
          const isSubscribed = await checkIfSubscribed(
            plan.account.creator,
            plan.account.planId,
            publicKey,
            program
          );
          statusMap[key] = isSubscribed;
        }
        setSubscriptionStatus(statusMap);
      }
    } catch (err) {
      setError("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkIfSubscribed = async (
    creator: PublicKey,
    planId: BN,
    subscriber: PublicKey,
    program: any
  ): Promise<boolean> => {
    try {
      const [subscriptionPda] = getSubscriptionPda(subscriber, creator, planId);
      await program.account.subscription.fetch(subscriptionPda);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [publicKey]);

  const handleSubscribe = async (plan: PlanData) => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setError("Please connect your wallet first");
      return;
    }

    const planKey = `${plan.account.creator.toBase58()}-${plan.account.planId.toString()}`;
    setSubscribingTo(planKey);
    setError("");

    try {
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      const { program } = getProgram(wallet);

      const [creatorProfilePda] = getCreatorProfilePda(
        plan.account.creator,
        plan.account.planId
      );

      const [subscriptionPda] = getSubscriptionPda(
        publicKey,
        plan.account.creator,
        plan.account.planId
      );

      const tx = await program.methods
        .subscribe(plan.account.planId, plan.account.creator)
        .accountsPartial({
          subscription: subscriptionPda,
          creatorProfile: creatorProfilePda,
          subscriber: publicKey,
          creatorAccount: plan.account.creator,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSubscriptionStatus((prev) => ({
        ...prev,
        [planKey]: true,
      }));

      await fetchPlans();
    } catch (err) {
      let errorMessage = "Failed to subscribe. Please try again.";
      const errMsg = (err as Error).message;

      if (errMsg.includes("InsufficientFunds")) {
        errorMessage =
          "Insufficient funds. You need enough SOL to cover the subscription price plus transaction fees.";
      } else if (errMsg.includes("CannotSubscribeToOwnPlan")) {
        errorMessage = "You cannot subscribe to your own plan.";
      } else if (errMsg.includes("CreatorMismatch")) {
        errorMessage = "Creator account mismatch. Please try again.";
      } else if (errMsg.includes("already in use")) {
        errorMessage = "You are already subscribed to this plan.";
      } else if (errMsg.includes("User rejected")) {
        errorMessage = "Transaction was cancelled.";
      }

      setError(errorMessage);
    } finally {
      setSubscribingTo(null);
    }
  };

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
          Marketplace
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          Browse all available subscription plans
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
            Loading plans...
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
        Marketplace
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Browse all available subscription plans
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

      {plans.length === 0 ? (
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
            No subscription plans available yet.
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
          {plans.map((plan) => {
            const planKey = `${plan.account.creator.toBase58()}-${plan.account.planId.toString()}`;
            const isSubscribed = subscriptionStatus[planKey] || false;
            const isSubscribing = subscribingTo === planKey;
            const isOwnPlan = publicKey
              ? plan.account.creator.equals(publicKey)
              : false;

            return (
              <div
                key={planKey}
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "1rem",
                  }}
                >
                  {plan.account.name}
                </h3>

                <div style={{ marginBottom: "1rem", flex: 1 }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Price:
                    </span>
                    <span
                      style={{
                        fontSize: "1.125rem",
                        color: "#111827",
                        fontWeight: "600",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {lamportsToSol(plan.account.price.toNumber())} SOL
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.5rem" }}>
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
                      {plan.account.durationDays} days
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.5rem" }}>
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
                      {truncateAddress(plan.account.creator.toBase58())}
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
                      Plan ID:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {plan.account.planId.toString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    !publicKey || isSubscribed || isSubscribing || isOwnPlan
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor:
                      !publicKey || isSubscribed || isSubscribing || isOwnPlan
                        ? "#9ca3af"
                        : "#512da8",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor:
                      !publicKey || isSubscribed || isSubscribing || isOwnPlan
                        ? "not-allowed"
                        : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      publicKey &&
                      !isSubscribed &&
                      !isSubscribing &&
                      !isOwnPlan
                    ) {
                      e.currentTarget.style.backgroundColor = "#3f1d87";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      publicKey &&
                      !isSubscribed &&
                      !isSubscribing &&
                      !isOwnPlan
                    ) {
                      e.currentTarget.style.backgroundColor = "#512da8";
                    }
                  }}
                >
                  {!publicKey
                    ? "Cannot subscribe without a wallet"
                    : isOwnPlan
                    ? "Your Plan"
                    : isSubscribed
                    ? "Already Subscribed"
                    : isSubscribing
                    ? "Subscribing..."
                    : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
