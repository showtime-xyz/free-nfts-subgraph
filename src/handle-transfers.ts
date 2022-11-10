import { log } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/SingleEditionMintableCreator/SingleEditionMintable"
import { FreeNFTTransfer } from "../generated/schema";


export function handleTransfer(event: TransferEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  
  if (!event.receipt) {
    log.critical(
      "No receipt in tx {}",
      [event.transaction.hash.toHex()]
    );

    return;
  }

  if (!event.receipt.contractAddress) {
    log.critical(
      "No contract address in tx {}",
      [event.transaction.hash.toHex()]
    );

    return;
  }

  let transfer = new FreeNFTTransfer(id);
  
  transfer.editionAddress = event.receipt.contractAddress;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.tokenId = event.params.tokenId;
  transfer.transferredAt = event.block.timestamp;
  
  log.info(
    "New transfer of edition {} tokenId {} from {} to {} at time {}",
    [
      transfer.editionAddress.toHex(),
      transfer.tokenId.toString(),
      transfer.from.toHex(),
      transfer.to.toHex(),
      transfer.transferredAt.toString(),
    ]
  )
  
  transfer.save();
}
