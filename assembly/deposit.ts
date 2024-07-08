import { SystemAPI, TxOutput, getEnv } from "@vsc.eco/sdk/assembly";
import { JSON } from "assemblyscript-json/assembly";
import { addPoolShares, totalBalances } from "./storage";
import { BigInt } from "as-bigint/assembly";

class DepositArgs {
  public hbd: u64 = 0;
  public hive: u64 = 0;

  clampToRatio(totalHbd: u64, totalHive: u64): void {
    if (this.hbd !== 0) {
      let hbd = BigInt.from(this.hbd);
      let hiveFactor = hbd.mul(totalHive);
      while (!hiveFactor.mod(totalHbd).eq(BigInt.ZERO)) {
        hbd = hbd.sub(BigInt.ONE);
        hiveFactor = hbd.mul(totalHive);
      }
      this.hbd = hbd.toUInt64();
      this.hive = hiveFactor.div(totalHbd).toUInt64();
    } else {
      let hive = BigInt.from(this.hive);
      let hbdFactor = hive.mul(totalHbd);
      while (!hbdFactor.mod(totalHive).eq(BigInt.ZERO)) {
        hive = hive.sub(BigInt.ONE);
        hbdFactor = hive.mul(totalHbd);
      }
      this.hive = hive.toUInt64();
      this.hbd = hbdFactor.div(totalHive).toUInt64();
    }
  }
}

export function depositParseArgs(args: String): DepositArgs {
  const rawJson = JSON.parse(args);
  assert(rawJson.isObj);

  const json = <JSON.Obj>rawJson;
  const res = new DepositArgs();

  if (json.has("hbd")) {
    const hbd = json.getInteger("hbd");
    assert(hbd !== null);
    res.hbd = hbd!.valueOf();
  }

  if (json.has("hive")) {
    const hive = json.getInteger("hive");
    assert(hive !== null);
    res.hive = hive!.valueOf();
  }

  assert((res.hbd === 0) != (res.hive === 0));

  return res;
}

/**
 *
 * @param from
 * @param amount
 * @param asset {'Hive' | 'HBD'}
 */
function hiveDraw(from: String, amount: u64, asset: String): void {
  const drawArgs = new JSON.Obj();
  drawArgs.set("from", from);
  drawArgs.set("amount", amount);
  drawArgs.set("asset", asset);
  const sysCallArgs = new JSON.Obj();
  sysCallArgs.set("arg0", drawArgs.stringify());
  const res = JSON.parse(SystemAPI.call("hive.draw", sysCallArgs.stringify()));
  assert(res.isObj);
  const rawCallResObj = (res as JSON.Obj).getObj("result");
  const rawCallRes = rawCallResObj ? rawCallResObj.getString("result") : null;
  const callRes = rawCallRes ? rawCallRes.valueOf() : "MALFORMED_RESULT";
  assert(callRes === "SUCCESS", callRes);
}

export function depositExec(args: DepositArgs): TxOutput {
  const env = getEnv();
  const balances = totalBalances(env);
  const hbd = balances.hbd;
  const hive = balances.hive;

  args.clampToRatio(hbd, hive);

  console.log("clamped hive: " + args.hive.toString());
  console.log("clamped hbd: " + args.hbd.toString());

  hiveDraw(env.msg_sender, args.hbd, "HBD");
  hiveDraw(env.msg_sender, args.hive, "HIVE");

  const shares = BigInt.from(args.hbd).mul(args.hive);
  addPoolShares(env.msg_sender, shares);

  const res = new JSON.Obj();
  res.set("hbd", args.hbd);
  res.set("hive", args.hive);
  res.set("shares", shares.toString());
  return new TxOutput().ret(res.stringify());
}
