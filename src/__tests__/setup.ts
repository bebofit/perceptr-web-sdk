// Workaround for slow execution on Windows, you can increase it depending on your machine's performance
jest.setTimeout(20000);

/* 
  Note: No need to mock a non-user module (node_modules) explicitly as jest does that automatically
  for the __mocks__ folder placed at root level
*/
// jest.mock("../src/lib/multer-s3-transformer");
// jest.mock("../src/lib/nodemailer");
// jest.mock("../src/common/services/storage");
