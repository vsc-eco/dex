import { ENV_DEFINITION, SystemAPI, db, getEnv } from "@vsc.eco/sdk/assembly";
import { BigInt } from "as-bigint/assembly";
import { JSON } from "assemblyscript-json/assembly";

// TODO move to SDK
export class Balances {
  public hbd: u64 = 0;
  public hive: u64 = 0;
}
function getBalances(account: String, tag: String = ""): Balances {
  const balanceArgs = new JSON.Obj();
  balanceArgs.set("account", account);
  balanceArgs.set("tag", tag);
  const sysCallArgs = new JSON.Obj();
  sysCallArgs.set("arg0", balanceArgs.stringify());
  const rawRes = JSON.parse(
    SystemAPI.call("hive.getbalance", sysCallArgs.stringify())
  );
  assert(rawRes.isObj);
  const rawCallResObj = (rawRes as JSON.Obj).getObj("result");
  const rawCallRes = rawCallResObj ? rawCallResObj.getObj("result") : null;
  // TODO is i64 (63 bits) enough bit perssicion
  const rawHive = rawCallRes ? rawCallRes.getInteger("HIVE") : null;
  const rawHbd = rawCallRes ? rawCallRes.getInteger("HBD") : null;
  assert(rawHive !== null && rawHbd !== null, "MALFORMED_RESPONSE");
  return {
    hbd: rawHbd!.valueOf(),
    hive: rawHive!.valueOf(),
  };
}

export function totalBalances(env: ENV_DEFINITION): Balances {
  return getBalances(env.contract_id);
}

// TODO fix contract VM so that this is not necessary
function ensureObjectExists(path: String): void {
  const obj = db.getObject(path);
  if (obj === "null") {
    db.setObject(path, "{}");
  }
}

export function poolShares(user: String): BigInt {
  ensureObjectExists("shares");
  const shares = db.getObject(`shares/${user}`);
  if (shares === "null") {
    return BigInt.ZERO;
  }
  return BigInt.from(shares);
}

function setPoolShares(user: String, amount: BigInt): void {
  ensureObjectExists("shares");
  db.setObject(`shares/${user}`, amount.toString());
}

export function addPoolShares(user: String, amount: BigInt): void {
  const shares = poolShares(user);
  setPoolShares(user, shares.add(amount));
}

export function removePoolShares(user: String, amount: u64): void {
  const shares = poolShares(user);
  setPoolShares(user, shares.sub(amount));
}
