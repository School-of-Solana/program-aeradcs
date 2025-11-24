import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../utils/anchorSetup";
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

interface SubscriptionData {
  account: {
    subscriber: PublicKey;
    creator: PublicKey;
    planId: BN;
    expiresAt: BN;
    createdAt: BN;
  };
}

interface TopPlanStats {
  plan: PlanData;
  subscriberCount: number;
  totalEarned: number;
}

export const TopPlans = () => {
  const [topPlans, setTopPlans] = useState<TopPlanStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTopPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const { program } = getProgram();

      const allPlans = await program.account.creatorProfile.all();
      const allSubscriptions = await program.account.subscription.all();

      const planStatsMap = new Map<string, TopPlanStats>();

      for (const plan of allPlans as PlanData[]) {
        const key = `${plan.account.creator.toBase58()}-${plan.account.planId.toString()}`;
        planStatsMap.set(key, {
          plan,
          subscriberCount: 0,
          totalEarned: 0,
        });
      }

      for (const subscription of allSubscriptions as SubscriptionData[]) {
        const key = `${subscription.account.creator.toBase58()}-${subscription.account.planId.toString()}`;
        const stats = planStatsMap.get(key);
        if (stats) {
          stats.subscriberCount += 1;
        }
      }

      for (const stats of planStatsMap.values()) {
        const priceInSol = lamportsToSol(stats.plan.account.price.toNumber());
        stats.totalEarned = stats.subscriberCount * priceInSol;
      }

      const sortedPlans = Array.from(planStatsMap.values())
        .sort((a, b) => b.subscriberCount - a.subscriberCount)
        .slice(0, 5);

      setTopPlans(sortedPlans);
    } catch (err) {
      setError("Failed to load top plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPlans();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Top 5 Most Subscribed Plans
        </h1>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading top plans...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && topPlans.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No plans available yet.</p>
          </div>
        )}

        {!loading && !error && topPlans.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Plan Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Price (SOL)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Subscribers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Earned (SOL)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPlans.map((stats, index) => (
                  <tr
                    key={`${stats.plan.account.creator.toBase58()}-${stats.plan.account.planId.toString()}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : index === 1
                            ? "bg-gray-300 text-gray-900"
                            : index === 2
                            ? "bg-orange-400 text-orange-900"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {stats.plan.account.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.plan.account.durationDays} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-mono">
                        {truncateAddress(
                          stats.plan.account.creator.toBase58()
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-purple-600">
                        {lamportsToSol(stats.plan.account.price.toNumber())}{" "}
                        SOL
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {stats.subscriberCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">
                        {stats.totalEarned.toFixed(2)} SOL
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && topPlans.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing top {topPlans.length} most subscribed plan
            {topPlans.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};
