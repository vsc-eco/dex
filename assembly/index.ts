import { depositExec, depositParseArgs } from "./deposit";
import { withdrawExec, withdrawParseArgs } from "./withdraw";
import { swapExec, swapParseArgs } from "./swap";

export function deposit(args: String): String {
  return depositExec(depositParseArgs(args)).done();
}

export function withdraw(args: String): String {
  return withdrawExec(withdrawParseArgs(args)).done();
}

export function swap(args: String): String {
  return swapExec(swapParseArgs(args)).done();
}
