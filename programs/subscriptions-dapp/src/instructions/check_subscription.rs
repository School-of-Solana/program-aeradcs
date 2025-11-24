use crate::{errors::SubscriptionsDappError, state::Subscription};
use anchor_lang::prelude::*;

pub fn _check_subscription(ctx: Context<CheckSubscription>) -> Result<bool> {
    let subscription = &ctx.accounts.subscription;
    let current_time = Clock::get()?.unix_timestamp;

    if current_time <= subscription.expires_at {
        return Ok(true);
    } else {
        return Ok(false);
    }
}

#[derive(Accounts)]
pub struct CheckSubscription<'info> {
    #[account(
        seeds = [b"subscription", subscription.subscriber.as_ref(), subscription.creator.as_ref(), subscription.plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
}
