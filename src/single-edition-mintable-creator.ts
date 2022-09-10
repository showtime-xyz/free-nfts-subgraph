import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { CreatedEdition as CreatedEditionEvent } from "../generated/SingleEditionMintableCreator/SingleEditionMintableCreator"
import { FreeNFTDrop } from "../generated/schema";

export function handleCreatedEdition(event: CreatedEditionEvent): void {
  let receipt = event.receipt;
  if (!receipt) {
    log.warning("No receipt for event in tx {}", [event.transaction.hash.toHex()]);
    return;
  }

  let timeLimitSetMatches = receipt.logs.filter(log => log.topics[0] === Bytes.fromHexString("0x776e7116fa43d9385f3fd667b2e34d792fd3eec4b5a0aa8d1758b877ab4d6cbe"));
  if (!timeLimitSetMatches || timeLimitSetMatches.length == 0) {
    log.info("Skipping edition {}, no TimeLimitSet event in tx {}",
    [event.params.editionContractAddress.toHexString(), event.transaction.hash.toHexString()]);
    return;
  }

  let timeLimitSet = timeLimitSetMatches[0];

  // the parameters are not indexed, collection and deadline are packed into data, e.g.:
  // "data": "0x000000000000000000000000c39231fe8f61f1860c0cc0a9c8a016e46a8d0e7e0000000000000000000000000000000000000000000000000000000063435af8"
  let collectionAddress = Address.fromString(timeLimitSet.data.toHexString().slice(2 + 24, 2 + 64));
  if (collectionAddress !== event.params.editionContractAddress) {
    log.warning("In tx {}, collection address {} in TimeLimitSetEvent does not match editionContractAddress {} in CreatedEditionEvent",
    [event.transaction.hash.toHexString(), collectionAddress.toHexString(), event.params.editionContractAddress.toHexString()]);
    return;
  }

  let entity = new FreeNFTDrop(collectionAddress);
  entity.creator = event.params.creator
  entity.editionSize = event.params.editionSize
  entity.deadline = BigInt.fromUnsignedBytes(Bytes.fromHexString(timeLimitSet.data.toHexString().slice(2 + 64)));

  // let edition = SingleEditionMintable.bind(collectionAddress);
  // entity.name = edition.name();
  // edition.description = edition.description();
  // edition.animationUrl = edition.getURIs()[0];
  // edition.imageUrl = edition.getURIs()[2];

  entity.save()
}
