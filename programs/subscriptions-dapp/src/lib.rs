use anchor_lang::prelude::*;

declare_id!("8hSScVud3dY7iV2r4aGDFBduXAZh5j31X3P8GnCaznZd");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

pub const MAX_PLAN_PRICE: u64 = 1_000_000_000_000;
pub const MAX_DURATION_DAYS: u32 = 365;
pub const TRANSACTION_FEE_BUFFER: u64 = 10_000_000;

#[program]
pub mod subscriptions_dapp {
    use super::*;

    pub fn create_subscription_plan(
        ctx: Context<CreateSubscriptionPlan>,
        plan_id: u64,
        name: String,
        price: u64,
        duration_days: u32,
    ) -> Result<()> {
        _create_subscription_plan(ctx, plan_id, name, price, duration_days)
    }

    pub fn subscribe(ctx: Context<Subscribe>, plan_id: u64, creator: Pubkey) -> Result<()> {
        _subscribe(ctx, plan_id, creator)
    }

    pub fn check_subscription(ctx: Context<CheckSubscription>) -> Result<bool> {
        _check_subscription(ctx)
    }
}
