use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("8hSScVud3dY7iV2r4aGDFBduXAZh5j31X3P8GnCaznZd");

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
        let creator_profile = &mut ctx.accounts.creator_profile;
        creator_profile.creator = ctx.accounts.creator.key();
        creator_profile.plan_id = plan_id;
        creator_profile.name = name;
        creator_profile.price = price;
        creator_profile.duration_days = duration_days;
        creator_profile.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn subscribe(ctx: Context<Subscribe>, plan_id: u64, creator: Pubkey) -> Result<()> {
        let creator_profile = &ctx.accounts.creator_profile;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.subscriber.to_account_info(),
                    to: ctx.accounts.creator_account.to_account_info(),
                },
            ),
            creator_profile.price,
        )?;

        let subscription = &mut ctx.accounts.subscription;
        subscription.subscriber = ctx.accounts.subscriber.key();
        subscription.creator = creator;
        subscription.plan_id = plan_id;
        subscription.created_at = Clock::get()?.unix_timestamp;

        let duration_seconds = (creator_profile.duration_days as i64) * 86400;
        subscription.expires_at = Clock::get()?.unix_timestamp + duration_seconds;

        Ok(())
    }

    pub fn check_subscription(ctx: Context<CheckSubscription>) -> Result<bool> {
        let subscription = &ctx.accounts.subscription;
        let current_time = Clock::get()?.unix_timestamp;

        if current_time > subscription.expires_at {
            return Err(ErrorCode::SubscriptionExpired.into());
        }

        Ok(true)
    }
}

#[account]
pub struct CreatorProfile {
    pub creator: Pubkey,
    pub plan_id: u64,
    pub name: String,
    pub price: u64,
    pub duration_days: u32,
    pub created_at: i64,
}

#[account]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub creator: Pubkey,
    pub plan_id: u64,
    pub expires_at: i64,
    pub created_at: i64,
}

#[derive(Accounts)]
#[instruction(plan_id: u64, name: String)]
pub struct CreateSubscriptionPlan<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 4 + 200 + 8 + 4 + 8,
        seeds = [b"plan", creator.key().as_ref(), plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(plan_id: u64)]
pub struct Subscribe<'info> {
    #[account(
        init,
        payer = subscriber,
        space = 8 + 32 + 32 + 8 + 8 + 8,
        seeds = [b"subscription", subscriber.key().as_ref(), creator_profile.creator.as_ref(), plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    #[account(
        seeds = [b"plan", creator_profile.creator.as_ref(), creator_profile.plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    #[account(mut)]
    pub subscriber: Signer<'info>,
    #[account(mut)]
    pub creator_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckSubscription<'info> {
    #[account(
        seeds = [b"subscription", subscription.subscriber.as_ref(), subscription.creator.as_ref(), subscription.plan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Subscription has expired")]
    SubscriptionExpired,
}
