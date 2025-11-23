use crate::errors::SubscriptionsDappError;
use crate::state::CreatorProfile;
use crate::{MAX_DURATION_DAYS, MAX_PLAN_PRICE};
use anchor_lang::prelude::*;

pub fn _create_subscription_plan(
    ctx: Context<CreateSubscriptionPlan>,
    plan_id: u64,
    name: String,
    price: u64,
    duration_days: u32,
) -> Result<()> {
    require!(price > 0, SubscriptionsDappError::InvalidPrice);

    require!(
        price <= MAX_PLAN_PRICE,
        SubscriptionsDappError::PriceTooHigh
    );

    require!(duration_days > 0, SubscriptionsDappError::InvalidDuration);

    require!(
        duration_days <= MAX_DURATION_DAYS,
        SubscriptionsDappError::DurationTooLong
    );

    require!(
        !name.trim().is_empty(),
        SubscriptionsDappError::EmptyPlanName
    );

    require!(name.len() <= 200, SubscriptionsDappError::PlanNameTooLong);

    let creator_balance = ctx.accounts.creator.lamports();
    let required_rent = Rent::get()?.minimum_balance(8 + CreatorProfile::INIT_SPACE);

    require!(
        creator_balance >= required_rent,
        SubscriptionsDappError::InsufficientFundsToCreatePlan
    );

    let creator_profile = &mut ctx.accounts.creator_profile;

    creator_profile.creator = ctx.accounts.creator.key();
    creator_profile.plan_id = plan_id;
    creator_profile.name = name;
    creator_profile.price = price;
    creator_profile.duration_days = duration_days;
    creator_profile.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
#[instruction(plan_id: u64, name: String)]
pub struct CreateSubscriptionPlan<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + CreatorProfile::INIT_SPACE,
        seeds = [b"plan", creator.key().as_ref(), plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
