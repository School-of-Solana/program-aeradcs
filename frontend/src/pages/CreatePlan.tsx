import { useState } from "react";
import type { FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { getProgram } from "../utils/anchorSetup";
import { getCreatorProfilePda } from "../utils/helpers";
import { solToLamports } from "../utils/constants";

export const CreatePlan = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    if (!planName.trim()) {
      setError("Please enter a plan name");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price greater than 0");
      return;
    }

    if (priceNum > 1000) {
      setError("Price exceeds maximum allowed (1000 SOL)");
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Please enter a valid duration greater than 0");
      return;
    }

    if (durationNum < 1) {
      setError("Duration must be at least 1 day");
      return;
    }

    if (durationNum > 365) {
      setError("Duration exceeds maximum allowed (365 days)");
      return;
    }

    setLoading(true);

    try {
      // Create wallet adapter object that matches AnchorWallet interface
      if (!signTransaction || !signAllTransactions) {
        throw new Error("Wallet does not support required signing methods");
      }

      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      const { program } = getProgram(wallet);

      // Generate unique plan_id using timestamp
      const planId = new BN(Date.now());

      // Convert SOL to lamports
      const priceInLamports = solToLamports(priceNum);

      // Derive PDA for creator profile
      const [creatorProfilePda] = getCreatorProfilePda(publicKey, planId);

      const tx = await program.methods
        .createSubscriptionPlan(
          planId,
          planName.trim(),
          new BN(priceInLamports),
          durationNum
        )
        .accountsPartial({
          creatorProfile: creatorProfilePda,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess("Plan created successfully!");

      // Clear form
      setPlanName("");
      setPrice("");
      setDuration("");

      // Redirect to My Plans after 2 seconds
      setTimeout(() => {
        navigate("/my-plans");
      }, 2000);
    } catch (err) {
      let errorMessage = "Failed to create plan. Please try again.";
      const errMsg = (err as Error).message;
      const errString = JSON.stringify(err);
      const errorLogs = (err as any)?.logs || [];
      const fullError = errMsg + " " + errString + " " + errorLogs.join(" ");

      if (fullError.includes("InvalidPrice") || fullError.includes("6000")) {
        errorMessage = "Price must be greater than 0.";
      } else if (
        fullError.includes("PriceTooHigh") ||
        fullError.includes("6001")
      ) {
        errorMessage = "Price exceeds maximum allowed (1000 SOL).";
      } else if (
        fullError.includes("InvalidDuration") ||
        fullError.includes("6002")
      ) {
        errorMessage = "Duration must be at least 1 day.";
      } else if (
        fullError.includes("DurationTooLong") ||
        fullError.includes("6003")
      ) {
        errorMessage = "Duration exceeds maximum allowed (365 days).";
      } else if (
        fullError.includes("EmptyPlanName") ||
        fullError.includes("6004")
      ) {
        errorMessage = "Plan name cannot be empty.";
      } else if (
        fullError.includes("PlanNameTooLong") ||
        fullError.includes("6005")
      ) {
        errorMessage = "Plan name exceeds maximum length (200 characters).";
      } else if (
        fullError.includes("InsufficientFundsToCreatePlan") ||
        fullError.includes("6006")
      ) {
        errorMessage =
          "Insufficient funds to create plan. You need SOL to pay for account rent.";
      } else if (fullError.includes("already in use")) {
        errorMessage = "This plan already exists.";
      } else if (fullError.includes("User rejected")) {
        errorMessage = "Transaction was cancelled.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          Create Plan
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          Create a new subscription plan for your subscribers
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
        Create Plan
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Create a new subscription plan for your subscribers
      </p>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          maxWidth: "600px",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Plan Name */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="planName"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Plan Name
            </label>
            <input
              type="text"
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Premium Membership"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#512da8")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="price"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Price (in SOL)
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 0.5"
              step="0.01"
              min="0"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#512da8")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Duration */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="duration"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Duration (in days)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 30"
              min="1"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#512da8")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Error Message */}
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

          {/* Success Message */}
          {success && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#d1fae5",
                border: "1px solid #6ee7b7",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ color: "#065f46", fontSize: "0.875rem", margin: 0 }}>
                {success}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#9ca3af" : "#512da8",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#3f1d87";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#512da8";
              }
            }}
          >
            {loading ? "Creating Plan..." : "Create Plan"}
          </button>
        </form>
      </div>
    </div>
  );
};
