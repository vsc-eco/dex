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
} from "@vsc.eco/contract-testing-utils";

// import { beforeEach, describe, it } from "mocha";
import { expect } from "chai";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("withdraw", () => {
  it("should parse args", () => {
    expect(contract.withdrawParseArgs(JSON.stringify({ shares: "20" }))).to.eql(
      { shares: "20" }
    );
  });
  it("should execute", () => {
    balanceSnapshots.set(contract_id, {
      account: contract_id,
      tokens: {
        HIVE: 10,
        HBD: 3,
      },
    });
    stateCache.set(`shares/${contractEnv["msg.sender"]}`, "20");
    expect(() => contract.withdrawExec({ shares: "20" })).to.not.throw();
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
    stateCache.set(`shares/${contractEnv["msg.sender"]}`, "20");
    expect(contract.withdraw(JSON.stringify({ shares: "20" }))).to.equal(
      JSON.stringify({ msg: "success" })
    );
    finalizeTransaction();
  });
});
