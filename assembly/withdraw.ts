import { TxOutput } from "@vsc.eco/sdk/assembly";

class WithdrawArgs {}

export function withdrawParseArgs(args: String): WithdrawArgs {
  return new WithdrawArgs();
}

export function withdrawExec(args: WithdrawArgs): TxOutput {
  return new TxOutput();
}
