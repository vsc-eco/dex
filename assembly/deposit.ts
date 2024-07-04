import { TxOutput } from "@vsc.eco/sdk/assembly";

class DepositArgs {}

export function depositParseArgs(args: String): DepositArgs {
  return new DepositArgs();
}

export function depositExec(args: DepositArgs): TxOutput {
  return new TxOutput();
}
