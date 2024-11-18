import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
export const generateFakeMessage = (
  sender: string,
  source: any = null,
  pass: any = []
): any => {
  return {
    _id: new mongoose.Types.ObjectId(),
    sender: sender,
    sent: faker.date.past(),
    delivered: faker.date.recent(),
    seen: faker.date.recent(),
    type: faker.helpers.arrayElement([
      "text",
      "image",
      "audio",
      "video",
      "document",
    ]),
    content: faker.lorem.sentence(),
    media: [
      {
        path: faker.image.url(),
        type: faker.helpers.arrayElement(["image", "video"]),
        isSaved: faker.datatype.boolean(),
        sourceInfo: {}, // You can fill this with more detailed fake data if needed
      },
    ],
    context: new mongoose.Types.ObjectId(),
    source:
      source !== null
        ? {
            platform: faker.helpers.arrayElement(["whatsapp", null]),
            refId: faker.string.uuid(),
          }
        : null,
    pass:
      pass.length !== 0
        ? [
            {
              platform: faker.helpers.arrayElement(["whatsapp", null]),
              refId: faker.string.uuid(),
            },
          ]
        : [],
    isDeleted: faker.datatype.boolean(),
  };
};

// Example usage
// if (require.main === module) {
//   const fakeMessage = generateFakeMessage(new mongoose.Types.ObjectId());
//   console.log(fakeMessage);
// }
