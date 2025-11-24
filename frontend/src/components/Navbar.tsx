import { Link } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

export const Navbar = () => {
  return (
    <nav
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem 0",
        marginBottom: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#111827",
              margin: 0,
            }}
          >
            Subscriptions dApp
          </h1>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link
              to="/"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Marketplace
            </Link>
            <Link
              to="/top-plans"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Top Plans
            </Link>
            <Link
              to="/my-plans"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              My Plans
            </Link>
            <Link
              to="/my-subscriptions"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              My Subscriptions
            </Link>
            <Link
              to="/create"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Create Plan
            </Link>
          </div>
        </div>
        <WalletConnect />
      </div>
    </nav>
  );
};
