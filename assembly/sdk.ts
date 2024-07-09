import { SystemAPI } from "@vsc.eco/sdk/assembly";
import { JSON } from "assemblyscript-json/assembly";

/**
 *
 * @param from
 * @param amount
 * @param {'Hive' | 'HBD'} asset
 */
export function hiveDraw(from: String, amount: u64, asset: String): void {
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

/**
 *
 * @param from
 * @param amount
 * @param {'Hive' | 'HBD'} asset
 */
export function hiveTransfer(dest: String, amount: u64, asset: String): void {
  const transferArgs = new JSON.Obj();
  transferArgs.set("dest", dest);
  transferArgs.set("amount", amount);
  transferArgs.set("asset", asset);
  const sysCallArgs = new JSON.Obj();
  sysCallArgs.set("arg0", transferArgs.stringify());
  const res = JSON.parse(
    SystemAPI.call("hive.transfer", sysCallArgs.stringify())
  );
  assert(res.isObj);
  const rawCallResObj = (res as JSON.Obj).getObj("result");
  const rawCallRes = rawCallResObj ? rawCallResObj.getString("result") : null;
  const callRes = rawCallRes ? rawCallRes.valueOf() : "MALFORMED_RESULT";
  assert(callRes === "SUCCESS", callRes);
}

/**
 *
 * @param from
 * @param amount
 * @param {'Hive' | 'HBD'} asset
 */
export function hiveWithdraw(dest: String, amount: u64, asset: String): void {
  const transferArgs = new JSON.Obj();
  transferArgs.set("dest", dest);
  transferArgs.set("amount", amount);
  transferArgs.set("asset", asset);
  const sysCallArgs = new JSON.Obj();
  sysCallArgs.set("arg0", transferArgs.stringify());
  const res = JSON.parse(
    SystemAPI.call("hive.withdraw", sysCallArgs.stringify())
  );
  assert(res.isObj);
  const rawCallResObj = (res as JSON.Obj).getObj("result");
  const rawCallRes = rawCallResObj ? rawCallResObj.getString("result") : null;
  const callRes = rawCallRes ? rawCallRes.valueOf() : "MALFORMED_RESULT";
  assert(callRes === "SUCCESS", callRes);
}
