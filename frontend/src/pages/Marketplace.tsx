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

      if (!signTransaction || !signAllTransactions) {
        const connection = new (await import("@solana/web3.js")).Connection(
          import.meta.env.VITE_RPC_URL,
          "confirmed"
        );
        const { Program } = await import("@coral-xyz/anchor");
        const idl = await import("../idl/subscriptions_dapp.json");
        const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID);
        const program = new Program(idl.default as any, programId, {
          connection,
        } as any);

        const allPlans = await program.account.creatorProfile.all();
        setPlans(allPlans as PlanData[]);
        setLoading(false);
        return;
      }

      const wallet = {
        publicKey: publicKey!,
        signTransaction,
        signAllTransactions,
      };

      const { program } = getProgram(wallet);
      const allPlans = await program.account.creatorProfile.all();
      setPlans(allPlans as PlanData[]);

      if (publicKey) {
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
      console.error("Error fetching plans:", err);
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

      console.log("Subscribing to plan:");
      console.log("  Plan ID:", plan.account.planId.toString());
      console.log("  Creator:", plan.account.creator.toBase58());
      console.log("  Subscriber:", publicKey.toBase58());
      console.log("  Subscription PDA:", subscriptionPda.toBase58());

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

      console.log("Subscription transaction signature:", tx);

      setSubscriptionStatus((prev) => ({
        ...prev,
        [planKey]: true,
      }));

      await fetchPlans();
    } catch (err) {
      console.error("Error subscribing:", err);
      setError(
        (err as Error).message || "Failed to subscribe. Please try again."
      );
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
                  disabled={!publicKey || isSubscribed || isSubscribing}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor:
                      !publicKey || isSubscribed || isSubscribing
                        ? "#9ca3af"
                        : "#512da8",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor:
                      !publicKey || isSubscribed || isSubscribing
                        ? "not-allowed"
                        : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (publicKey && !isSubscribed && !isSubscribing) {
                      e.currentTarget.style.backgroundColor = "#3f1d87";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (publicKey && !isSubscribed && !isSubscribing) {
                      e.currentTarget.style.backgroundColor = "#512da8";
                    }
                  }}
                >
                  {!publicKey
                    ? "Connect Wallet"
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
