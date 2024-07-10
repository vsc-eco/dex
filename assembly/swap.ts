import { TxOutput, getEnv } from "@vsc.eco/sdk/assembly";
import { Balances, totalBalances } from "./storage";
import { BigInt } from "as-bigint/assembly";
import { hiveDraw, hiveTransfer, hiveWithdraw } from "./sdk";
import { JSON } from "assemblyscript-json/assembly";

class MaxSlippage {
  public numerator: String = "";
  public denominator: String = "";

  toFrac(): Frac {
    return new Frac(BigInt.from(this.numerator), BigInt.from(this.denominator));
  }
}

class SwapArgs {
  public hbd: u64 = 0;
  public hive: u64 = 0;
  public withdraw: bool = false;
  public maxSlippage: MaxSlippage = new MaxSlippage();

  /**
   * TODO update these docs as they no longer exactly reflect the algorithm in this function
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
    const lastK = BigInt.from(total.hbd).mul(total.hive);
    const hbdIn = this.hbd !== 0;
    if (hbdIn) {
      const newTotalHbd = BigInt.from(total.hbd + this.hbd);
      let newTotalHive = lastK.div(newTotalHbd);
      console.log(`lastK: ${lastK.toString()}`);
      console.log(`newTotalHbd: ${newTotalHbd.toString()}`);
      console.log(`newTotalHive: ${newTotalHive.toString()}`);
      while (!newTotalHive.mul(newTotalHbd).gte(lastK)) {
        newTotalHive = newTotalHive.add(BigInt.ONE);
        console.log(`newTotalHive: ${newTotalHive.toString()}`);
      }
      const newTotalHiveFinal = newTotalHive.toUInt64();
      assert(total.hive > newTotalHiveFinal, "LOW_LIQUIDITY");
      const hive = total.hive - newTotalHiveFinal;
      assert(
        computeSlippage(total, hive, this.hbd, "HBD")
          .compare(this.maxSlippage.toFrac())
          .lte(BigInt.ZERO),
        "HIGH_SLIPPAGE"
      );
      this.hive = hive;
    } else {
      const newTotalHive = BigInt.from(total.hive + this.hive);
      let newTotalHbd = lastK.div(newTotalHive);
      console.log(`lastK: ${lastK.toString()}`);
      console.log(`newTotalHbd: ${newTotalHive.toString()}`);
      console.log(`newTotalHive: ${newTotalHbd.toString()}`);
      while (!newTotalHbd.mul(newTotalHive).gte(lastK)) {
        newTotalHbd = newTotalHbd.add(BigInt.ONE);
        console.log(`newTotalHive: ${newTotalHbd.toString()}`);
      }
      const newTotalHbdFinal = newTotalHbd.toUInt64();
      assert(total.hbd > newTotalHbdFinal, "LOW_LIQUIDITY");
      const hbd = total.hbd - newTotalHbdFinal;
      assert(
        computeSlippage(total, this.hive, hbd, "HIVE")
          .compare(this.maxSlippage.toFrac())
          .lte(BigInt.ZERO),
        "HIGH_SLIPPAGE"
      );
      this.hbd = hbd;
    }
  }
}

class Frac {
  constructor(private numerator: BigInt, private denominator: BigInt) {
    console.log(this.toString());
  }

  compare<T>(to: T): BigInt {
    if (to instanceof BigInt) return this.compareBigInt(to);
    if (to instanceof Frac) return this.compareFrac(to);
    throw new TypeError("Unsupported generic type " + nameof<T>(to));
  }

  compareBigInt(to: BigInt): BigInt {
    return this.numerator.sub(this.denominator.mul(to));
  }

  compareFrac(to: Frac): BigInt {
    return this.numerator
      .mul(to.denominator)
      .sub(this.denominator.mul(to.numerator));
  }

  mul<T>(other: T): Frac {
    return new Frac(this.numerator.mul(other), this.denominator);
  }

  div<T>(other: T): Frac {
    return new Frac(this.numerator, this.denominator.mul(other));
  }

  toString(): string {
    return `${this.numerator.toString()}/${this.denominator.toString()}`;
  }
}

/**
 *
 * @param total
 * @param hive
 * @param hbd
 * @param {'HIVE' | 'HBD'} assetToMaximize
 */
function computeSlippage(
  total: Balances,
  hive: u64,
  hbd: u64,
  assetToMaximize: String
): Frac {
  const DHt = BigInt.from(total.hive).mul(hbd);
  const HDt = BigInt.from(total.hbd).mul(hive);
  const diff = DHt.sub(HDt);
  console.log(`DHt: ${DHt}
    HDt: ${HDt}
    diff: ${diff}
    hbd: ${hbd}
    hive: ${hive}`);
  if (assetToMaximize === "HBD") {
    return new Frac(diff, HDt);
  } else {
    return new Frac(diff.mul(BigInt.NEG_ONE), DHt);
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

  assert(json.has("maxSlippage"));
  const maxSlippageJsonObj = json.getObj("maxSlippage");
  assert(maxSlippageJsonObj !== null);
  const val = maxSlippageJsonObj!;
  const maxSlippage = new MaxSlippage();
  const numerator = val.getString("numerator");
  const denominator = val.getString("denominator");
  assert(numerator !== null);
  assert(denominator !== null);
  maxSlippage.numerator = numerator!.valueOf();
  maxSlippage.denominator = denominator!.valueOf();
  res.maxSlippage = maxSlippage;

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
