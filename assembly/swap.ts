import { TxOutput } from "@vsc.eco/sdk/assembly";

class SwapArgs {}

export function swapParseArgs(args: String): SwapArgs {
  return new SwapArgs();
}

export function swapExec(args: SwapArgs): TxOutput {
  return new TxOutput();
}
