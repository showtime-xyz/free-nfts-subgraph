import { CreatedEdition as CreatedEditionEventV3 } from "../../generated/EditionFactory/EditionFactory"
import { EditionV3 } from "../../generated/EditionFactory/EditionV3";
import { FreeNFTDrop } from "../../generated/schema";
import { SingleEditionMintable as SingleEditionMintableTemplate } from "../../generated/templates";


export default function handleCreatedEdition(event: CreatedEditionEventV3): void {
  let collectionAddress = event.params.editionContractAddress;
  let edition = EditionV3.bind(collectionAddress);

  let entity = new FreeNFTDrop(collectionAddress);
  entity.createdAt = event.block.timestamp;
  entity.creator = event.params.creator;
  entity.editionSize = edition.editionSize();
  entity.name = edition.name();
  entity.description = edition.description();
  entity.imageUrl = edition.imageUrl();
  entity.animationUrl = edition.animationUrl();
  entity.deadline = edition.endOfMintPeriod();
  entity.save()

  SingleEditionMintableTemplate.create(collectionAddress);
}
