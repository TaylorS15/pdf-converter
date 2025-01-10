import { PDFDocument } from "pdf-lib";
import { promises as fs } from "fs";
import sharp from "sharp";
import path from "path";

const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".webp",
]);
const INPUT_DIR = "./Input";

async function getImageFiles(directory: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directory);
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.has(ext);
      })
      .map((file) => path.join(directory, file))
      .sort();
  } catch (error) {
    throw new Error(
      `Error reading input directory: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
    );
  }
}

async function convertToJpg(inputPath: string): Promise<Buffer> {
  try {
    const imageBuffer = await fs.readFile(inputPath);
    const jpgBuffer = await sharp(imageBuffer).jpeg().toBuffer();
    return jpgBuffer;
  } catch (error) {
    throw new Error(
      `Error converting image ${inputPath}: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
    );
  }
}

async function photosToPdf(outputPdfPath: string) {
  try {
    await fs.access(INPUT_DIR);
  } catch {
    throw new Error(
      `Input directory '${INPUT_DIR}' does not exist. Please create it and add your images.`,
    );
  }

  const inputPaths = await getImageFiles(INPUT_DIR);

  if (inputPaths.length === 0) {
    throw new Error("No valid image files found in the Input directory");
  }

  if (inputPaths.length > 100) {
    throw new Error("Maximum number of images (100) exceeded");
  }

  console.log(`Found ${inputPaths.length} valid image files`);

  const pdfDoc = await PDFDocument.create();

  for (const imagePath of inputPaths) {
    try {
      const jpgBuffer = await convertToJpg(imagePath);
      const image = await pdfDoc.embedJpg(jpgBuffer);
      const page = pdfDoc.addPage();

      const { width, height } = page.getSize();
      const imageAspectRatio = image.width / image.height;
      const pageAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;

      if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page proportionally
        drawHeight = width / imageAspectRatio;
      } else {
        // Image is taller than page proportionally
        drawWidth = height * imageAspectRatio;
      }

      // Center the image on the page
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      // Draw the image
      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      console.log(`Processed: ${imagePath}`);
    } catch (error) {
      console.error(
        `Error processing ${imagePath}: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
      );
      continue;
    }
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPdfPath, pdfBytes);
  console.log(`PDF created successfully: ${outputPdfPath}`);
}

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: ts-node index.ts <output_pdf_path>");
  console.error("Example: ts-node index.ts output.pdf");
  console.error('Note: Place all your images in the "./Input" directory');
  process.exit(1);
}

const outputPdfPath = args[0];

photosToPdf(outputPdfPath).catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
