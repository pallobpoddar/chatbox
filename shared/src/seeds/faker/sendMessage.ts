import { faker } from '@faker-js/faker';
import WhatsAppService from '../../services/whatsapp';

export const generateFakePayloadData = (): { recipientPhoneNumber: string, messaging_product: string, media: string, ManualType?: string } => {
  // Generate a ManualType that could be 'template' or null
  const ManualType:any = faker.helpers.arrayElement([null, 'template']);
  
  let messaging_product: string;
  let media: string;

  if (ManualType === 'template') {
    messaging_product = "hello_world"; // Fixed text for template type
    media = ''; // No media if it's a template
  } else {
    messaging_product = faker.helpers.arrayElement(['hi', 'hello', 'hey', 'how are you?']); // Random plain text content

    // Randomly decide if there's media or not
    const hasMedia = faker.datatype.boolean();
    media = hasMedia ? faker.helpers.arrayElement([ // Simulated image URL
      "D:/one.chat/one.chat/shared/public/1723233923259-264190842.ogg", // Simulated audio URL
      "D:/one.chat/one.chat/shared/public/download.jpg", // Simulated video URL
      "D:/one.chat/one.chat/shared/public/sample.pdf", // Simulated PDF URL
    ]) : '';
  }

  return {
    recipientPhoneNumber: '+8801739864401',
    messaging_product,
    media,
    ManualType
  };
};


