/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/subscriptions_dapp.json`.
 */
export type SubscriptionsDapp = {
  address: "8hSScVud3dY7iV2r4aGDFBduXAZh5j31X3P8GnCaznZd";
  metadata: {
    name: "subscriptionsDapp";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "checkSubscription";
      discriminator: [219, 133, 12, 68, 26, 101, 56, 138];
      accounts: [
        {
          name: "subscription";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ];
              },
              {
                kind: "account";
                path: "subscription.subscriber";
                account: "subscription";
              },
              {
                kind: "account";
                path: "subscription.creator";
                account: "subscription";
              },
              {
                kind: "account";
                path: "subscription.plan_id";
                account: "subscription";
              }
            ];
          };
        }
      ];
      args: [];
      returns: "bool";
    },
    {
      name: "createSubscriptionPlan";
      discriminator: [16, 48, 230, 197, 185, 141, 94, 190];
      accounts: [
        {
          name: "creatorProfile";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 110];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "planId";
              }
            ];
          };
        },
        {
          name: "creator";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "planId";
          type: "u64";
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "price";
          type: "u64";
        },
        {
          name: "durationDays";
          type: "u32";
        }
      ];
    },
    {
      name: "subscribe";
      discriminator: [254, 28, 191, 138, 156, 179, 183, 53];
      accounts: [
        {
          name: "subscription";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ];
              },
              {
                kind: "account";
                path: "subscriber";
              },
              {
                kind: "account";
                path: "creator_profile.creator";
                account: "creatorProfile";
              },
              {
                kind: "arg";
                path: "planId";
              }
            ];
          };
        },
        {
          name: "creatorProfile";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 110];
              },
              {
                kind: "account";
                path: "creator_profile.creator";
                account: "creatorProfile";
              },
              {
                kind: "account";
                path: "creator_profile.plan_id";
                account: "creatorProfile";
              }
            ];
          };
        },
        {
          name: "subscriber";
          writable: true;
          signer: true;
        },
        {
          name: "creatorAccount";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "planId";
          type: "u64";
        },
        {
          name: "creator";
          type: "pubkey";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "creatorProfile";
      discriminator: [251, 250, 184, 111, 214, 178, 32, 221];
    },
    {
      name: "subscription";
      discriminator: [64, 7, 26, 135, 102, 132, 98, 33];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "subscriptionExpired";
      msg: "Subscription has expired";
    }
  ];
  types: [
    {
      name: "creatorProfile";
      type: {
        kind: "struct";
        fields: [
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "planId";
            type: "u64";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "price";
            type: "u64";
          },
          {
            name: "durationDays";
            type: "u32";
          },
          {
            name: "createdAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "subscription";
      type: {
        kind: "struct";
        fields: [
          {
            name: "subscriber";
            type: "pubkey";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "planId";
            type: "u64";
          },
          {
            name: "expiresAt";
            type: "i64";
          },
          {
            name: "createdAt";
            type: "i64";
          }
        ];
      };
    }
  ];
};
