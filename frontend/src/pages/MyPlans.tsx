import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../utils/anchorSetup";
import { lamportsToSol, formatDate } from "../utils/constants";

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

export const MyPlans = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyPlans = async () => {
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
        const allPlans = await program.account.creatorProfile.all();

        const userPlans = allPlans.filter((plan) =>
          plan.account.creator.equals(publicKey)
        );

        setPlans(userPlans as PlanData[]);
      } catch (err) {
        setError("Failed to load your plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPlans();
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
          My Plans
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          View all subscription plans you've created
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
          My Plans
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          View all subscription plans you've created
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
            Loading your plans...
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
        My Plans
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        View all subscription plans you've created
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
            You haven't created any subscription plans yet. Create one to start
            accepting subscribers.
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
            const planKey = `${plan.publicKey.toBase58()}`;

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

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "0.75rem" }}>
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
                      {plan.account.durationDays} days
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

                  <div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Created:
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {formatDate(plan.account.createdAt.toNumber())}
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
