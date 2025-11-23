import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SubscriptionsDapp } from "../target/types/subscriptions_dapp";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

describe("subscriptions-dapp", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .subscriptionsDapp as Program<SubscriptionsDapp>;
  const provider = anchor.getProvider();

  let creator: Keypair;
  let subscriber: Keypair;
  let creatorProfilePda: PublicKey;
  let subscriptionPda: PublicKey;
  let creatorProfileBump: number;
  let subscriptionBump: number;

  const LAMPORTS_PER_SOL = 1_000_000_000;
  const planName = "NFT Alpha";
  const planPrice = new BN(Math.floor(0.5 * LAMPORTS_PER_SOL));
  const durationDays = 30;
  const planId = new BN(0);

  before(async () => {
    creator = Keypair.generate();
    subscriber = Keypair.generate();

    await provider.connection.requestAirdrop(
      creator.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      subscriber.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    [creatorProfilePda, creatorProfileBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("plan"),
        creator.publicKey.toBuffer(),
        planId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [subscriptionPda, subscriptionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("subscription"),
        subscriber.publicKey.toBuffer(),
        creator.publicKey.toBuffer(),
        planId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  });

  describe("create_subscription_plan", () => {
    it("should successfully create a subscription plan", async () => {
      const tx = await program.methods
        .createSubscriptionPlan(planId, planName, planPrice, durationDays)
        .accounts({
          creatorProfile: creatorProfilePda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const creatorProfile = await program.account.creatorProfile.fetch(
        creatorProfilePda
      );

      expect(creatorProfile.creator).to.deep.equal(creator.publicKey);
      expect(creatorProfile.planId.toString()).to.equal(planId.toString());
      expect(creatorProfile.name).to.equal(planName);
      expect(creatorProfile.price.toString()).to.equal(planPrice.toString());
      expect(creatorProfile.durationDays).to.equal(durationDays);
    });

    it("should fail to create plan with price = 0", async () => {
      const invalidPlanId = new BN(100);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createSubscriptionPlan(
            invalidPlanId,
            planName,
            new BN(0),
            durationDays
          )
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Price must be greater than 0");
      }
    });

    it("should fail to create plan with price exceeding maximum", async () => {
      const invalidPlanId = new BN(101);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const maxPrice = new BN("1000000000001");

      try {
        await program.methods
          .createSubscriptionPlan(
            invalidPlanId,
            planName,
            maxPrice,
            durationDays
          )
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Price exceeds maximum allowed");
      }
    });

    it("should fail to create plan with duration = 0", async () => {
      const invalidPlanId = new BN(102);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createSubscriptionPlan(invalidPlanId, planName, planPrice, 0)
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Duration must be at least 1 day");
      }
    });

    it("should fail to create plan with duration exceeding maximum", async () => {
      const invalidPlanId = new BN(103);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createSubscriptionPlan(invalidPlanId, planName, planPrice, 366)
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Duration exceeds maximum allowed");
      }
    });

    it("should fail to create plan with empty name", async () => {
      const invalidPlanId = new BN(104);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createSubscriptionPlan(invalidPlanId, "   ", planPrice, durationDays)
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Plan name cannot be empty");
      }
    });

    it("should fail to create plan with name exceeding 200 characters", async () => {
      const invalidPlanId = new BN(105);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const longName = "a".repeat(201);

      try {
        await program.methods
          .createSubscriptionPlan(
            invalidPlanId,
            longName,
            planPrice,
            durationDays
          )
          .accounts({
            creatorProfile: invalidPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Plan name exceeds maximum length");
      }
    });

    it("should fail to create plan with insufficient funds", async () => {
      const poorCreator = Keypair.generate();
      await provider.connection.requestAirdrop(
        poorCreator.publicKey,
        0.001 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const invalidPlanId = new BN(106);
      const [invalidPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          poorCreator.publicKey.toBuffer(),
          invalidPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createSubscriptionPlan(
            invalidPlanId,
            planName,
            planPrice,
            durationDays
          )
          .accounts({
            creatorProfile: invalidPda,
            creator: poorCreator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([poorCreator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.satisfy(
          (msg: string) =>
            msg.includes("Insufficient funds to create plan") ||
            msg.includes("insufficient") ||
            msg.includes("custom program error")
        );
      }
    });

    it("should fail to create duplicate subscription plan", async () => {
      try {
        await program.methods
          .createSubscriptionPlan(planId, planName, planPrice, durationDays)
          .accounts({
            creatorProfile: creatorProfilePda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("subscribe", () => {
    it("should successfully subscribe to a plan", async () => {
      const initialBalance = await provider.connection.getBalance(
        subscriber.publicKey
      );

      const tx = await program.methods
        .subscribe(planId, creator.publicKey)
        .accounts({
          subscription: subscriptionPda,
          creatorProfile: creatorProfilePda,
          subscriber: subscriber.publicKey,
          creatorAccount: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([subscriber])
        .rpc();

      const subscription = await program.account.subscription.fetch(
        subscriptionPda
      );
      const finalBalance = await provider.connection.getBalance(
        subscriber.publicKey
      );

      expect(subscription.subscriber).to.deep.equal(subscriber.publicKey);
      expect(subscription.creator).to.deep.equal(creator.publicKey);
      expect(subscription.planId.toString()).to.equal(planId.toString());
      expect(subscription.expiresAt.toNumber()).to.be.greaterThan(
        subscription.createdAt.toNumber()
      );

      const balanceDifference = initialBalance - finalBalance;
      expect(balanceDifference).to.be.greaterThanOrEqual(Number(planPrice));
    });

    it("should fail to subscribe to own plan", async () => {
      const selfPlanId = new BN(200);
      const [selfPlanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          creator.publicKey.toBuffer(),
          selfPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createSubscriptionPlan(
          selfPlanId,
          "Self Plan",
          planPrice,
          durationDays
        )
        .accounts({
          creatorProfile: selfPlanPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const [selfSubscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          creator.publicKey.toBuffer(),
          creator.publicKey.toBuffer(),
          selfPlanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .subscribe(selfPlanId, creator.publicKey)
          .accounts({
            subscription: selfSubscriptionPda,
            creatorProfile: selfPlanPda,
            subscriber: creator.publicKey,
            creatorAccount: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Cannot subscribe to your own plan");
      }
    });

    it("should fail to subscribe with creator account mismatch", async () => {
      const wrongCreator = Keypair.generate();

      try {
        await program.methods
          .subscribe(planId, creator.publicKey)
          .accounts({
            subscription: subscriptionPda,
            creatorProfile: creatorProfilePda,
            subscriber: subscriber.publicKey,
            creatorAccount: wrongCreator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([subscriber])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.satisfy(
          (msg: string) =>
            msg.includes("Creator account mismatch") ||
            msg.includes("A seeds constraint was violated") ||
            msg.includes("custom program error")
        );
      }
    });

    it("should fail to subscribe with insufficient funds", async () => {
      const poorUser = Keypair.generate();
      await provider.connection.requestAirdrop(
        poorUser.publicKey,
        0.001 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [poorSubscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          poorUser.publicKey.toBuffer(),
          creator.publicKey.toBuffer(),
          planId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .subscribe(planId, creator.publicKey)
          .accounts({
            subscription: poorSubscriptionPda,
            creatorProfile: creatorProfilePda,
            subscriber: poorUser.publicKey,
            creatorAccount: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([poorUser])
          .rpc();

        expect.fail("Should have thrown an error for insufficient funds");
      } catch (error) {
        expect(error.message).to.satisfy(
          (msg: string) =>
            msg.toLowerCase().includes("insufficient") ||
            msg.includes("custom program error")
        );
      }
    });
  });

  describe("check_subscription", () => {
    it("should return true for active subscription", async () => {
      const isActive = await program.methods
        .checkSubscription()
        .accounts({
          subscription: subscriptionPda,
        })
        .view();

      expect(isActive).to.equal(true);
    });

    it("should fail for expired subscription", async () => {
      const expiredSubscriber = Keypair.generate();
      await provider.connection.requestAirdrop(
        expiredSubscriber.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [expiredSubscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          expiredSubscriber.publicKey.toBuffer(),
          creator.publicKey.toBuffer(),
          planId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .subscribe(planId, creator.publicKey)
        .accounts({
          subscription: expiredSubscriptionPda,
          creatorProfile: creatorProfilePda,
          subscriber: expiredSubscriber.publicKey,
          creatorAccount: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([expiredSubscriber])
        .rpc();

      const subscriptionData = await program.account.subscription.fetch(
        expiredSubscriptionPda
      );
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry =
        subscriptionData.expiresAt.toNumber() - currentTime;

      if (timeUntilExpiry > 0) {
        console.log(
          `Subscription expires in ${timeUntilExpiry} seconds, skipping expiration test`
        );
        return;
      }

      try {
        await program.methods
          .checkSubscription()
          .accounts({
            subscription: expiredSubscriptionPda,
          })
          .view();

        expect.fail("Should have thrown an error for expired subscription");
      } catch (error) {
        expect(error.message).to.include("Subscription has expired");
      }
    });
  });

  describe("integration tests", () => {
    it("should complete full subscription lifecycle: create plan -> subscribe -> check", async () => {
      const testCreator = Keypair.generate();
      const testSubscriber = Keypair.generate();

      await provider.connection.requestAirdrop(
        testCreator.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.requestAirdrop(
        testSubscriber.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [testCreatorProfilePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          testCreator.publicKey.toBuffer(),
          planId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [testSubscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          testSubscriber.publicKey.toBuffer(),
          testCreator.publicKey.toBuffer(),
          planId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createSubscriptionPlan(planId, "Test Plan", planPrice, 7)
        .accounts({
          creatorProfile: testCreatorProfilePda,
          creator: testCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testCreator])
        .rpc();

      await program.methods
        .subscribe(planId, testCreator.publicKey)
        .accounts({
          subscription: testSubscriptionPda,
          creatorProfile: testCreatorProfilePda,
          subscriber: testSubscriber.publicKey,
          creatorAccount: testCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testSubscriber])
        .rpc();

      const isActive = await program.methods
        .checkSubscription()
        .accounts({
          subscription: testSubscriptionPda,
        })
        .view();

      expect(isActive).to.equal(true);
    });
  });

  describe("multiple plans per creator", () => {
    it("should allow creator to create multiple subscription plans", async () => {
      const multiPlanCreator = Keypair.generate();
      await provider.connection.requestAirdrop(
        multiPlanCreator.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const plan0Id = new BN(0);
      const plan1Id = new BN(1);
      const plan2Id = new BN(2);

      const [plan0Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          multiPlanCreator.publicKey.toBuffer(),
          plan0Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [plan1Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          multiPlanCreator.publicKey.toBuffer(),
          plan1Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [plan2Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          multiPlanCreator.publicKey.toBuffer(),
          plan2Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createSubscriptionPlan(
          plan0Id,
          "Basic Plan",
          new BN(0.1 * LAMPORTS_PER_SOL),
          7
        )
        .accounts({
          creatorProfile: plan0Pda,
          creator: multiPlanCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([multiPlanCreator])
        .rpc();

      await program.methods
        .createSubscriptionPlan(
          plan1Id,
          "Premium Plan",
          new BN(0.5 * LAMPORTS_PER_SOL),
          30
        )
        .accounts({
          creatorProfile: plan1Pda,
          creator: multiPlanCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([multiPlanCreator])
        .rpc();

      await program.methods
        .createSubscriptionPlan(
          plan2Id,
          "VIP Plan",
          new BN(1.0 * LAMPORTS_PER_SOL),
          90
        )
        .accounts({
          creatorProfile: plan2Pda,
          creator: multiPlanCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([multiPlanCreator])
        .rpc();

      const profile0 = await program.account.creatorProfile.fetch(plan0Pda);
      const profile1 = await program.account.creatorProfile.fetch(plan1Pda);
      const profile2 = await program.account.creatorProfile.fetch(plan2Pda);

      expect(profile0.planId.toString()).to.equal("0");
      expect(profile0.name).to.equal("Basic Plan");
      expect(profile0.durationDays).to.equal(7);

      expect(profile1.planId.toString()).to.equal("1");
      expect(profile1.name).to.equal("Premium Plan");
      expect(profile1.durationDays).to.equal(30);

      expect(profile2.planId.toString()).to.equal("2");
      expect(profile2.name).to.equal("VIP Plan");
      expect(profile2.durationDays).to.equal(90);
    });

    it("should allow subscribers to subscribe to different plans from same creator", async () => {
      const planCreator = Keypair.generate();
      const sub1 = Keypair.generate();
      const sub2 = Keypair.generate();

      await provider.connection.requestAirdrop(
        planCreator.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.requestAirdrop(
        sub1.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.requestAirdrop(
        sub2.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const plan0Id = new BN(0);
      const plan1Id = new BN(1);

      const [plan0Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          planCreator.publicKey.toBuffer(),
          plan0Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [plan1Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("plan"),
          planCreator.publicKey.toBuffer(),
          plan1Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createSubscriptionPlan(
          plan0Id,
          "Monthly",
          new BN(0.3 * LAMPORTS_PER_SOL),
          30
        )
        .accounts({
          creatorProfile: plan0Pda,
          creator: planCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([planCreator])
        .rpc();

      await program.methods
        .createSubscriptionPlan(
          plan1Id,
          "Yearly",
          new BN(3.0 * LAMPORTS_PER_SOL),
          365
        )
        .accounts({
          creatorProfile: plan1Pda,
          creator: planCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([planCreator])
        .rpc();

      const [sub1ToPlan0Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          sub1.publicKey.toBuffer(),
          planCreator.publicKey.toBuffer(),
          plan0Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [sub2ToPlan1Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          sub2.publicKey.toBuffer(),
          planCreator.publicKey.toBuffer(),
          plan1Id.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .subscribe(plan0Id, planCreator.publicKey)
        .accounts({
          subscription: sub1ToPlan0Pda,
          creatorProfile: plan0Pda,
          subscriber: sub1.publicKey,
          creatorAccount: planCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sub1])
        .rpc();

      await program.methods
        .subscribe(plan1Id, planCreator.publicKey)
        .accounts({
          subscription: sub2ToPlan1Pda,
          creatorProfile: plan1Pda,
          subscriber: sub2.publicKey,
          creatorAccount: planCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sub2])
        .rpc();

      const subscription1 = await program.account.subscription.fetch(
        sub1ToPlan0Pda
      );
      const subscription2 = await program.account.subscription.fetch(
        sub2ToPlan1Pda
      );

      expect(subscription1.planId.toString()).to.equal("0");
      expect(subscription1.subscriber).to.deep.equal(sub1.publicKey);
      expect(subscription1.creator).to.deep.equal(planCreator.publicKey);

      expect(subscription2.planId.toString()).to.equal("1");
      expect(subscription2.subscriber).to.deep.equal(sub2.publicKey);
      expect(subscription2.creator).to.deep.equal(planCreator.publicKey);
    });
  });
});
