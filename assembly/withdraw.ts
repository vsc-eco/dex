import { TxOutput, getEnv } from "@vsc.eco/sdk/assembly";
import { BigInt } from "as-bigint/assembly";
import { JSON } from "assemblyscript-json/assembly";
import { poolShares, removePoolShares, totalBalances } from "./storage";
import { hiveTransfer } from "./sdk";

class WithdrawArgs {
  public shares: string = "";
}

export function withdrawParseArgs(args: String): WithdrawArgs {
  const json = JSON.parse(args);
  assert(json.isObj);
  const rawShares = (json as JSON.Obj).getString("shares");
  assert(rawShares !== null);
  return {
    shares: rawShares!.valueOf(),
  };
}

export function withdrawExec(args: WithdrawArgs): TxOutput {
  const env = getEnv();
  const shares = BigInt.from(args.shares);
  // TODO gas savings on poolShares
  assert(shares.lte(poolShares(env.msg_sender)));
  const total = totalBalances(env);
  const K = BigInt.from(total.hbd).mul(total.hive);
  const hive = shares.mul(total.hive).div(K);
  const hbd = shares.mul(total.hbd).div(K);

  hiveTransfer(env.msg_sender, hive.toUInt64(), "HIVE");
  hiveTransfer(env.msg_sender, hbd.toUInt64(), "HBD");

  removePoolShares(env.msg_sender, shares.toUInt64());

  return new TxOutput().msg("success");
}
