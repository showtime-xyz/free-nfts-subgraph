import { ethereum } from "@graphprotocol/graph-ts";

export function log_toString(log: ethereum.Log): string {
  return log.topics[0].toHexString();
}

export function logs_toString(logs: Array<ethereum.Log>): string {
  return logs.map(log_toString).join(", ");
}
