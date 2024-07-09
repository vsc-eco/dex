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
} from "@vsc.eco/contract-testing-utils";

// import { beforeEach, describe, it } from "mocha";
import { expect } from "chai";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("swap", () => {
  it("should parse args", () => {
    expect(contract.swapParseArgs(JSON.stringify({ hbd: 10 }))).to.eql({
      hbd: 10n,
      hive: 0n,
      withdraw: false,
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
    intents.push({
      name: "hive.allow_transfer",
      args: {
        token: "hbd",
        limit: 10,
      },
    });
    expect(() =>
      contract.swapExec({ hbd: 10n, hive: 0n, withdraw: false })
    ).to.not.throw();
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
    intents.push({
      name: "hive.allow_transfer",
      args: {
        token: "hbd",
        limit: 10,
      },
    });
    expect(contract.swap(JSON.stringify({ hbd: 10 }))).to.equal(
      JSON.stringify({
        ret: JSON.stringify({
          hive: 4,
          hbd: 2,
          in: "HBD",
          out: "HIVE",
          withdraw: false,
        }),
      })
    );
    finalizeTransaction();
  });
});
