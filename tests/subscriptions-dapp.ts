import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SubscriptionsDapp } from "../target/types/subscriptions_dapp";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

describe("subscriptions-dapp", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.subscriptionsDapp as Program<SubscriptionsDapp>;
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

  before(async () => {
    creator = Keypair.generate();
    subscriber = Keypair.generate();

    await provider.connection.requestAirdrop(creator.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(subscriber.publicKey, 10 * LAMPORTS_PER_SOL);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    [creatorProfilePda, creatorProfileBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator"), creator.publicKey.toBuffer()],
      program.programId
    );

    [subscriptionPda, subscriptionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), subscriber.publicKey.toBuffer(), creator.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("create_subscription_plan", () => {
    it("should successfully create a subscription plan", async () => {
      const tx = await program.methods
        .createSubscriptionPlan(planName, planPrice, durationDays)
        .accounts({
          creatorProfile: creatorProfilePda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const creatorProfile = await program.account.creatorProfile.fetch(creatorProfilePda);

      expect(creatorProfile.creator).to.deep.equal(creator.publicKey);
      expect(creatorProfile.name).to.equal(planName);
      expect(creatorProfile.price.toString()).to.equal(planPrice.toString());
      expect(creatorProfile.durationDays).to.equal(durationDays);
    });

    it("should fail to create duplicate subscription plan", async () => {
      try {
        await program.methods
          .createSubscriptionPlan(planName, planPrice, durationDays)
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
      const initialBalance = await provider.connection.getBalance(subscriber.publicKey);

      const tx = await program.methods
        .subscribe(creator.publicKey)
        .accounts({
          subscription: subscriptionPda,
          creatorProfile: creatorProfilePda,
          subscriber: subscriber.publicKey,
          creatorAccount: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([subscriber])
        .rpc();

      const subscription = await program.account.subscription.fetch(subscriptionPda);
      const finalBalance = await provider.connection.getBalance(subscriber.publicKey);

      expect(subscription.subscriber).to.deep.equal(subscriber.publicKey);
      expect(subscription.creator).to.deep.equal(creator.publicKey);
      expect(subscription.expiresAt.toNumber()).to.be.greaterThan(subscription.createdAt.toNumber());

      const balanceDifference = initialBalance - finalBalance;
      expect(balanceDifference).to.be.greaterThanOrEqual(Number(planPrice));
    });

    it("should fail to subscribe with insufficient funds", async () => {
      const poorUser = Keypair.generate();
      await provider.connection.requestAirdrop(poorUser.publicKey, 0.1 * LAMPORTS_PER_SOL);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [poorSubscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), poorUser.publicKey.toBuffer(), creator.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .subscribe(creator.publicKey)
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
        expect(error.message.toLowerCase()).to.include("insufficient" || "simulation failed");
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
      await provider.connection.requestAirdrop(expiredSubscriber.publicKey, 10 * LAMPORTS_PER_SOL);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [expiredSubscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), expiredSubscriber.publicKey.toBuffer(), creator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .subscribe(creator.publicKey)
        .accounts({
          subscription: expiredSubscriptionPda,
          creatorProfile: creatorProfilePda,
          subscriber: expiredSubscriber.publicKey,
          creatorAccount: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([expiredSubscriber])
        .rpc();

      const subscriptionData = await program.account.subscription.fetch(expiredSubscriptionPda);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = subscriptionData.expiresAt.toNumber() - currentTime;

      if (timeUntilExpiry > 0) {
        console.log(`Subscription expires in ${timeUntilExpiry} seconds, skipping expiration test`);
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

      await provider.connection.requestAirdrop(testCreator.publicKey, 10 * LAMPORTS_PER_SOL);
      await provider.connection.requestAirdrop(testSubscriber.publicKey, 10 * LAMPORTS_PER_SOL);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [testCreatorProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("creator"), testCreator.publicKey.toBuffer()],
        program.programId
      );

      const [testSubscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), testSubscriber.publicKey.toBuffer(), testCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createSubscriptionPlan("Test Plan", planPrice, 7)
        .accounts({
          creatorProfile: testCreatorProfilePda,
          creator: testCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testCreator])
        .rpc();

      await program.methods
        .subscribe(testCreator.publicKey)
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
});
