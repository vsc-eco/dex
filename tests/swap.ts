import {
  logs,
  contract,
  reset,
  stateCache,
  contractEnv,
  setContractImport,
  finalizeTransaction,
  balanceSnapshots,
  contract_id,
  intents,
  ledgerStack,
} from "@vsc.eco/contract-testing-utils";

import { expect as chaiExpect, use, Assertion } from "chai";
import chaiJestSnapshot from "chai-jest-snapshot";
const beforeAll = globalThis.beforeAll || globalThis.before;
use(chaiJestSnapshot);
const expect = chaiExpect as unknown as (
  val: any,
  message?: string
) => typeof Assertion & {
  to: InstanceType<typeof Assertion> & {
    matchSnapshot(): void;
  };
};
// const { beforeAll, beforeEach, describe, it } = globalThis;

const contractImport = import("../build/debug");

beforeAll(() => {
  chaiJestSnapshot.resetSnapshotRegistry();
  return setContractImport(contractImport);
});

beforeEach(async () => {
  // if (globalThis.alert) {
  //   chaiJestSnapshot.configureUsingMochaContext(
  //     // @ts-ignore
  //     (await import("mocha")).default
  //   );
  // }
  return reset();
});

describe("swap", () => {
  it("should parse args", () => {
    expect(
      contract.swapParseArgs(
        JSON.stringify({
          hbd: 10,
          maxSlippage: {
            numerator: "2",
            denominator: "100",
          },
        })
      )
    ).to.eql({
      hbd: 10n,
      hive: 0n,
      withdraw: false,
      maxSlippage: {
        numerator: "2",
        denominator: "100",
      },
    });
  });
  it("should execute", () => {
    balanceSnapshots.set(contract_id, {
      account: contract_id,
      tokens: {
        HIVE: 10000,
        HBD: 3000,
      },
    });
    contractEnv["msg.sender"] = "someAccountName";
    balanceSnapshots.set(contractEnv["msg.sender"], {
      account: contractEnv["msg.sender"],
      tokens: {
        HIVE: 35,
        HBD: 10,
      },
    });
    intents.push({
      name: "hive.allow_transfer",
      args: {
        token: "hbd",
        limit: 10,
      },
    });
    expect(() =>
      contract.swapExec({
        hbd: 10n,
        hive: 0n,
        withdraw: false,
        maxSlippage: {
          numerator: "2",
          denominator: "100",
        },
      })
    ).to.not.throw();
    finalizeTransaction();
  });
  it("should run e2e", () => {
    balanceSnapshots.set(contract_id, {
      account: contract_id,
      tokens: {
        HIVE: 1000000000,
        HBD: 300000000,
      },
    });
    contractEnv["msg.sender"] = "someAccountName";
    balanceSnapshots.set(contractEnv["msg.sender"], {
      account: contractEnv["msg.sender"],
      tokens: {
        HIVE: 35,
        HBD: 10,
      },
    });
    intents.push({
      name: "hive.allow_transfer",
      args: {
        token: "hbd",
        limit: 10,
      },
    });
    expect(
      contract.swap(
        JSON.stringify({
          hbd: 10,
          maxSlippage: {
            numerator: "2",
            denominator: "100",
          },
        })
      )
    ).to.equal(
      JSON.stringify({
        ret: JSON.stringify({
          hive: 33,
          hbd: 10,
          in: "HBD",
          out: "HIVE",
          withdraw: false,
        }),
      })
    );
    finalizeTransaction();
    expect(ledgerStack).to.matchSnapshot();
  });
});
