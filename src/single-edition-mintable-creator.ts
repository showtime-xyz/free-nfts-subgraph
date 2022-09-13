import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { CreatedEdition as CreatedEditionEvent } from "../generated/SingleEditionMintableCreator/SingleEditionMintableCreator"
import { FreeNFTDrop } from "../generated/schema";

function log_toString(log: ethereum.Log): string {
  return log.topics[0].toHexString();
}

function logs_toString(logs: Array<ethereum.Log>): string {
  return logs.map(log_toString).join(", ");
}

function processTimeLimitSet(event: CreatedEditionEvent, timeLimitSet: ethereum.Log): void {
  // the parameters are not indexed, collection and deadline are packed into data, e.g.:
  // "data": "0x000000000000000000000000c39231fe8f61f1860c0cc0a9c8a016e46a8d0e7e0000000000000000000000000000000000000000000000000000000063435af8"

  // no 0x prefix
  let collectionAddressStr = timeLimitSet.data.toHexString().slice(2 + 24, 2 + 64).toLowerCase();
  if (!event.params.editionContractAddress.toHexString().toLowerCase().includes(collectionAddressStr)) {
    log.warning("In tx {}, collection address {} in TimeLimitSetEvent does not match editionContractAddress {} in CreatedEditionEvent",
    [event.transaction.hash.toHexString(), collectionAddressStr, event.params.editionContractAddress.toHexString()]);
    return;
  }

  let entity = new FreeNFTDrop(event.params.editionContractAddress);
  entity.creator = event.params.creator
  entity.editionSize = event.params.editionSize
  entity.deadline = BigInt.fromUnsignedBytes(Bytes.fromHexString(timeLimitSet.data.toHexString().slice(2 + 64, 2 + 128)));

  // let edition = SingleEditionMintable.bind(collectionAddress);
  // entity.name = edition.name();
  // edition.description = edition.description();
  // edition.animationUrl = edition.getURIs()[0];
  // edition.imageUrl = edition.getURIs()[2];

  entity.save()
}

export function handleCreatedEdition(event: CreatedEditionEvent): void {
  let receipt = event.receipt;
  if (!receipt) {
    log.critical("No receipt for event in tx {}", [event.transaction.hash.toHex()]);
    return;
  }

  let txHash = event.transaction.hash.toHexString();

  // checking all receipt.logs for a match on topics[0]
  for (let i = 0; i < receipt.logs.length; i++) {
    let someLog = receipt.logs[i];
    let topic = log_toString(someLog);

    if (topic.includes("0x776e7116fa43d9385f3fd667b2e34d792fd3eec4b5a0aa8d1758b877ab4d6cbe")) {
      processTimeLimitSet(event, someLog);
      return;
    }
  }

  log.warning("No TimeLimitSet event in tx {}", [txHash]);
}
