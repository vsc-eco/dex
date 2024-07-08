import {
  logs,
  contract,
  reset,
  stateCache,
  contractEnv,
  setContractImport,
  finalizeTransaction,
  intents,
  balanceSnapshots,
  contract_id,
} from "@vsc.eco/contract-testing-utils";

// import { beforeEach, describe, it } from "mocha";
import { expect } from "chai";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("deposit", () => {
  it("should parse args", () => {
    expect(contract.depositParseArgs(JSON.stringify({ hbd: 10 }))).to.eql({
      hbd: 10n,
      hive: 0n,
    });
  });
  it("should execute", () => {
    balanceSnapshots.set(contract_id, {
      account: contract_id,
      tokens: {
        HIVE: 10,
        HBD: 3,
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
    intents.push(
      {
        name: "hive.allow_transfer",
        args: {
          token: "hive",
          limit: (10 * 10) / 3,
        },
      },
      {
        name: "hive.allow_transfer",
        args: {
          token: "hbd",
          limit: 10,
        },
      }
    );
    expect(() => contract.depositExec({ hbd: 10n, hive: 0n })).to.not.throw();
    finalizeTransaction();
  });
  it("should run e2e", () => {
    balanceSnapshots.set(contract_id, {
      account: contract_id,
      tokens: {
        HIVE: 10,
        HBD: 3,
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
    intents.push(
      {
        name: "hive.allow_transfer",
        args: {
          token: "hive",
          limit: (10 * 10) / 3,
        },
      },
      {
        name: "hive.allow_transfer",
        args: {
          token: "hbd",
          limit: 10,
        },
      }
    );
    expect(contract.deposit(JSON.stringify({ hbd: 10 }))).to.equal(
      JSON.stringify({
        ret: JSON.stringify({ hbd: 9, hive: 30, shares: "270" }),
      })
    );
    finalizeTransaction();
  });
});
