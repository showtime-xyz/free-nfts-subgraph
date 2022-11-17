import { log, Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/SingleEditionMintableCreator/SingleEditionMintable";
import { FreeNFTBalance, FreeNFTDrop } from "../../generated/schema";

let NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

function loadBalance(
  drop: FreeNFTDrop,
  address: Address
): FreeNFTBalance | null {
  if (address.toHexString() == NULL_ADDRESS) {
    log.info("Ignoring null address for balance update", []);

    return null;
  }

  let id = drop.id.toHexString() + "-" + address.toHexString();

  let balance = FreeNFTBalance.load(id);

  if (balance == null) {
    balance = new FreeNFTBalance(id);

    balance.address = address;
    balance.quantity = BigInt.zero();
    balance.drop = drop.id;
  }

  if (balance.address != address) {
    log.error(
      "Balance with id {} has owner address {}, which does not match address {}",
      [balance.id, balance.address.toHexString(), address.toHexString()]
    );

    return null;
  }

  return balance;
}

function updateBalance(
  balance: FreeNFTBalance,
  quantityDelta: i32,
  event: TransferEvent
): void {
  let updatedQuantity = balance.quantity.plus(BigInt.fromI32(quantityDelta));

  if (updatedQuantity.lt(BigInt.zero())) {
    log.error(
      "Balance with id {} has negative quantity {} after transfer in tx {}, ignoring update",
      [
        balance.id,
        updatedQuantity.toString(),
        event.transaction.hash.toHexString()
      ]
    );

    return;
  }

  balance.quantity = updatedQuantity;
  balance.updatedAt = event.block.timestamp;

  balance.save();
}

export default function handleTransfer(event: TransferEvent): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  let editionAddress = event.address;

  let drop = FreeNFTDrop.load(
    Bytes.fromHexString(editionAddress.toHexString())
  );

  if (drop == null) {
    log.critical("Drop with address {} not found", [
      editionAddress.toHexString()
    ]);

    return;
  }

  let sender = event.params.from;
  let receiver = event.params.to;

  let senderBalance = loadBalance(drop, sender);
  let receiverBalance = loadBalance(drop, receiver);

  if (senderBalance != null) {
    updateBalance(senderBalance, -1, event);
  }

  if (receiverBalance != null) {
    updateBalance(receiverBalance, 1, event);
  }

  log.info(
    "New transfer of edition {} tokenId {} from {} to {} at time {} in transaction {} log index {}",
    [
      editionAddress.toHexString(),
      event.params.tokenId.toString(),
      sender.toHexString(),
      receiver.toHexString(),
      event.block.timestamp.toString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString()
    ]
  );
}
