import { JSON } from "assemblyscript-json/assembly";
import { Error } from "assemblyscript/std/assembly/error";

import { db, console, TxOutput } from "@vsc.eco/sdk/assembly";
// import {JSON} from 'json-as'

// import { sdk } from '@vsc.eco/sdk'

declare namespace System {
  function getEnv(str: String): String;
  function call(str: String): String;
}

class InvalidInputError extends Error {
  constructor(msg: String) {
    super(msg.toString());

    // Set the prototype explicitly.
    //   Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

function testError(msg: String): void {
  const json = new JSON.Obj();
  json.set("msg", msg);
  json.set("__t", "invalid_input");
  const error = new Error(json.stringify());
  throw error;
}

// function assertEqual

class ObjType {
  // @ts-ignore
  callCount: i32;
}
const obj: ObjType = {
  callCount: 0,
};

// @ts-ignore
// @external('env', 'seed')
// declare function seed(): i64;

export function testJSON(payload: String): string {
  let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

  console.log(jsonObj.stringify());
  console.log(jsonObj.keys[0]);
  jsonObj.keys.forEach((e) => {
    console.log(e);
  });

  console.log(
    `to value: ${jsonObj.getString("to")!} ${
      jsonObj.getString("to")!.toString() === "test1"
    }`
  );
  assert(jsonObj.getString("to")!, "test2");
  console.log(`assert code: ${assert(jsonObj.getString("to")!._str, "test2")}`);
  if (jsonObj.getString("to")!.valueOf() === "test1") {
    console.log("I should throw error");
    testError("I should break here");
  }

  db.setObject("key-1", jsonObj.stringify());
  const val = db.getObject("key-1");

  console.log(`test val`);
  console.log(val);

  obj.callCount = obj.callCount + 1;

  return `Count: ${obj.callCount}`;
}

class T_TOKEN_CONFIG {
  // @ts-ignore
  decimals: i64;
  // @ts-ignore
  mint_authority: String;
}

const TOKEN_CONFIG: T_TOKEN_CONFIG = {
  decimals: 3,
  mint_authority: "",
};

class transferPayload {
  // @ts-ignore
  to: String;
  // @ts-ignore
  from: String;
  // @ts-ignore
  amount: i64;
}

export function transfer(payload: String): String {
  let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);
  const transferPayload: transferPayload = {
    to: jsonObj.getString("to")!._str,
    from: "",
    amount: 33,
  };

  return new TxOutput().exitCode(0).done();
}

class MintPayload {
  // @ts-ignore
  to: String;
  // @ts-ignore
  amount: i64;
}

class MintVal {
  // @ts-ignore
  val: i64;
}

export function mint(payload: String): String {
  let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);
  const mintPayload: MintPayload = {
    amount: jsonObj.getInteger("amount")!.valueOf(),
    to: jsonObj.getString("to")!.valueOf(),
  };
  db.setObject(
    mintPayload.to,
    JSON.from<MintVal>({
      val: mintPayload.amount,
    }).stringify()
  );

  return new TxOutput().exitCode(0).msg("MINT_SUCCESS").done();
}

class BurnPayload {
  // @ts-ignore
  address: String;
  // @ts-ignore
  amount: i64;
}

export function burn(payload: String): String {
  let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);
  const out = new TxOutput();
  const amount = jsonObj.getInteger("amount");

  if (!amount) {
    return out.exitCode(-1).msg("Invalid Input").done();
  }

  if (!amount.isInteger) {
    return out.exitCode(-1).msg("Invalid data").done();
  }

  const burnPayload: BurnPayload = {
    amount: amount._num,
    address: jsonObj.getString("address")!._str,
  };
  const val = <JSON.Obj>(
    JSON.parse(db.getObject(`balances/${burnPayload.address}`))
  );

  const balance = val.getInteger("val");

  if (!balance) {
    return out.exitCode(-1).msg("Invalid data").done();
  }

  if (!balance.isInteger) {
    return out.exitCode(-1).msg("Invalid data").done();
  }

  if (balance._num < burnPayload.amount) {
    return out.exitCode(-1).msg("In sufficient balance").done();
  }

  return new TxOutput().done();
}
