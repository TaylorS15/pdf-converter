import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';

async function photosToPdf(
	photo1Path: string,
	photo2Path: string,
	photo3Path: string,
	outputPdfPath: string
) {
	// Create a new PDF document
	const pdfDoc = await PDFDocument.create();

	// Load the images
	const photo1 = await fs.readFile(photo1Path);
	const photo2 = await fs.readFile(photo2Path);
	const photo3 = await fs.readFile(photo3Path);

	// Embed the images in the PDF
	const image1 = await pdfDoc.embedJpg(photo1);
	const image2 = await pdfDoc.embedJpg(photo2);
	const image3 = await pdfDoc.embedJpg(photo3);

	// Add a page for each image
	const page1 = pdfDoc.addPage();
	const page2 = pdfDoc.addPage();
	const page3 = pdfDoc.addPage();

	// Get page dimensions
	const { width, height } = page1.getSize();

	// Draw the images on their respective pages
	page1.drawImage(image1, {
		x: 0,
		y: 0,
		width,
		height,
	});

	page2.drawImage(image2, {
		x: 0,
		y: 0,
		width,
		height,
	});

	page3.drawImage(image3, {
		x: 0,
		y: 0,
		width,
		height,
	});

	// Save the PDF
	const pdfBytes = await pdfDoc.save();
	await fs.writeFile(outputPdfPath, pdfBytes);

	console.log(`PDF created successfully: ${outputPdfPath}`);
}

// Get command line arguments
const [photo1Path, photo2Path, photo3Path, outputPdfPath] = process.argv.slice(2);

if (!photo1Path || !photo2Path || !photo3Path || !outputPdfPath) {
	console.error(
		'Usage: ts-node script.ts <photo1_path> <photo2_path> <output_pdf_path>'
	);
	process.exit(1);
}

photosToPdf(photo1Path, photo2Path, photo3Path, outputPdfPath).catch((error) => {
	console.error('An error occurred:', error);
	process.exit(1);
});
