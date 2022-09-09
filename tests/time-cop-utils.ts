import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { TimeLimitSet } from "../generated/TimeCop/TimeCop"

export function createTimeLimitSetEvent(
  collection: Address,
  deadline: BigInt
): TimeLimitSet {
  let timeLimitSetEvent = changetype<TimeLimitSet>(newMockEvent())

  timeLimitSetEvent.parameters = new Array()

  timeLimitSetEvent.parameters.push(
    new ethereum.EventParam(
      "collection",
      ethereum.Value.fromAddress(collection)
    )
  )
  timeLimitSetEvent.parameters.push(
    new ethereum.EventParam(
      "deadline",
      ethereum.Value.fromUnsignedBigInt(deadline)
    )
  )

  return timeLimitSetEvent
}
