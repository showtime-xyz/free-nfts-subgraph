import { log, Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/SingleEditionMintableCreator/SingleEditionMintable"
import { FreeNFTBalance, FreeNFTDrop } from "../../generated/schema";


let NULL_ADDRESS = "0x0000000000000000000000000000000000000000";


function updateBalance(
  event: TransferEvent, 
  drop: FreeNFTDrop, 
  address: Address, 
  isSender: boolean = false,
): void {
  if (address.toHexString() == NULL_ADDRESS) {
    log.info(
      "Ignoring null address for balance update in tx {} log index {}, isSender = {}",
      [
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
        isSender.toString(),
      ],
    );
    
    return;
  }

  let id = drop.id.toHexString() + "-" + address.toHexString(); 
  
  let balance = FreeNFTBalance.load(id);

  if (balance == null) {
    balance = new FreeNFTBalance(id);

    balance.address = address;
    balance.quantity = BigInt.fromI32(0);
    balance.drop = drop.id;
  }
  
  if (balance.address != address) {
    log.error(
      "Balance with id {} has owner address {}, which does not match address {}",
      [
        balance.id,
        balance.address.toHexString(),
        address.toHexString(),
      ]
    );
  }
  
  if (isSender) {
    balance.quantity = balance.quantity.minus(BigInt.fromI32(1));
  }
  
  else {
    balance.quantity = balance.quantity.plus(BigInt.fromI32(1));
  }

  balance.updatedAt = event.block.timestamp;
  balance.save();
}


export default function handleTransfer(event: TransferEvent): void {
  if (!event.address) {
    log.critical(
      "No contract address in tx {}",
      [event.transaction.hash.toHex()]
    );

    return;
  }

  let editionAddress = event.address;
  
  let drop = FreeNFTDrop.load(Bytes.fromHexString(editionAddress.toHexString()));
  
  if (drop == null) {
    log.critical(
      "Drop with address {} not found",
      [editionAddress.toHexString()]
    );

    return;
  }
  
  let sender = event.params.from;
  let receiver = event.params.to;
  
  updateBalance(event, drop, sender, true);
  updateBalance(event, drop, receiver, false);
  
  log.info(
    "New transfer of edition {} tokenId {} from {} to {} at time {} in transaction {} log index {}",
    [
      editionAddress.toHexString(),
      event.params.tokenId.toString(),
      sender.toHexString(),
      receiver.toHexString(),
      event.block.timestamp.toString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]
  )
}
