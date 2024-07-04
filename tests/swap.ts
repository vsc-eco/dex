import {
  logs,
  contract,
  reset,
  stateCache,
  contractEnv,
  setContractImport,
  finalizeTransaction,
} from "@vsc.eco/contract-testing-utils";

// import { beforeEach, describe, it } from "mocha";
import { expect } from "chai";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("swap", () => {
  it("should parse args", () => {
    expect(contract.swapParseArgs(JSON.stringify({ to: "test2" }))).to.eql({});
  });
  it("should execute", () => {
    expect(() =>
      contract.swapExec(JSON.stringify({ to: "test2" }))
    ).to.not.throw();
    finalizeTransaction();
  });
  it("should run e2e", () => {
    expect(contract.swap(JSON.stringify({ to: "test2" }))).to.equal(
      JSON.stringify({})
    );
    finalizeTransaction();
  });
});