import { TxOutput, getEnv } from "@vsc.eco/sdk/assembly";
import { Balances, totalBalances } from "./storage";
import { BigInt } from "as-bigint/assembly";
import { hiveDraw, hiveTransfer, hiveWithdraw } from "./sdk";
import { JSON } from "assemblyscript-json/assembly";

function min<Num extends number>(a: Num, b: Num): Num {
  return a < b ? a : b;
}

class SwapArgs {
  public hbd: u64 = 0;
  public hive: u64 = 0;
  public withdraw: bool = false;

  /**
   * H = HIVE balance of the contract
   * D = HBD balance of the contract
   * K = H * D
   *
   * K must remain constant during swaps
   *
   * Let h = requested HIVE to swap in
   *
   * Let d = HBD that will be swapped out
   *
   * So, the following equation must hold true after the swap is complete
   *
   * K = (H + h) * (D - d)
   *
   * This implies
   *
   * d = D - (K / (H + h))
   *
   * Since we need d to be an integer, we can subtract from h until (H + h) evenly divides K.
   * This also works if the user requested to swap in HBD instead. The HIVE and HBD values just need to be flipped.
   *
   * @param total the total balances of the contract (these are mentioned as H & D above)
   */
  computeOutAmount(total: Balances): void {
    const K = BigInt.from(total.hbd).mul(total.hive);
    const hbdIn = this.hbd !== 0;
    if (hbdIn) {
      let hbd = min(this.hbd, total.hbd - 1);
      while (!K.mod(total.hbd + hbd).eq(BigInt.ZERO)) {
        hbd -= 1;
      }
      assert(hbd !== 0);
      this.hbd = hbd;
      this.hive = total.hive - K.div(total.hbd + hbd).toUInt64();
    } else {
      let hive = min(this.hive, total.hive - 1);
      while (!K.mod(total.hive + hive).eq(BigInt.ZERO)) {
        hive -= 1;
      }
      assert(hive !== 0);
      this.hive = hive;
      this.hbd = total.hbd - K.div(total.hive + hive).toUInt64();
    }
  }
}

export function swapParseArgs(args: String): SwapArgs {
  const rawJson = JSON.parse(args);
  assert(rawJson.isObj);

  const json = <JSON.Obj>rawJson;
  const res = new SwapArgs();

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

  if (json.has("withdraw")) {
    const withdraw = json.getBool("withdraw");
    assert(withdraw !== null);
    res.withdraw = withdraw!.valueOf();
  }

  assert((res.hbd === 0) !== (res.hive === 0));

  return res;
}

export function swapExec(args: SwapArgs): TxOutput {
  const hbdIn = args.hbd !== 0;

  const env = getEnv();
  const total = totalBalances(env);
  args.computeOutAmount(total);

  const sendOutput = args.withdraw ? hiveWithdraw : hiveTransfer;

  if (hbdIn) {
    hiveDraw(env.msg_sender, args.hbd, "HBD");
    sendOutput(env.msg_sender, args.hive, "HIVE");
  } else {
    hiveDraw(env.msg_sender, args.hive, "HIVE");
    sendOutput(env.msg_sender, args.hbd, "HBD");
  }

  const res = new JSON.Obj();
  res.set("hive", args.hive);
  res.set("hbd", args.hbd);
  res.set("in", hbdIn ? "HBD" : "HIVE");
  res.set("out", hbdIn ? "HIVE" : "HBD");
  res.set("withdraw", args.withdraw);

  return new TxOutput().ret(res.stringify());
}
