use anchor_lang::prelude::*;

#[error_code]
pub enum SubscriptionsDappError {
    #[msg("Subscription has expired")]
    SubscriptionExpired,

    #[msg("Price must be greater than 0")]
    InvalidPrice,

    #[msg("Price exceeds maximum allowed (1000 SOL)")]
    PriceTooHigh,

    #[msg("Duration must be at least 1 day")]
    InvalidDuration,

    #[msg("Duration exceeds maximum allowed (365 days)")]
    DurationTooLong,

    #[msg("Plan name cannot be empty")]
    EmptyPlanName,

    #[msg("Plan name exceeds maximum length (200 characters)")]
    PlanNameTooLong,

    #[msg("Insufficient funds to create plan (need rent for account)")]
    InsufficientFundsToCreatePlan,

    #[msg("Cannot subscribe to your own plan")]
    CannotSubscribeToOwnPlan,

    #[msg("Insufficient funds to subscribe (need price + rent)")]
    InsufficientFunds,

    #[msg("Creator account mismatch")]
    CreatorMismatch,

    #[msg("Mathematical operation overflow")]
    MathOverflow,
}
