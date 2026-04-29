import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-expect-error - pdfjs-dist ships no declarations for the worker entry
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

// Nitro only traces statically-imported files, so the dynamic `import("./pdf.worker.mjs")`
// inside pdf.mjs fails in the bundled output. Exposing the worker module on globalThis
// makes pdfjs use the in-process handler and skip the dynamic import entirely.
(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

export class SignatureBoxExtractor {
  private readonly pdf;

  constructor(buffer: Buffer) {
    this.pdf = pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  }

  get numPages() {
    return this.pdf.then((pdf) => pdf.numPages);
  }

  async getSignBox(name: string, email: string) {
    const pdf = await this.pdf;
    const numPages = pdf.numPages;
    const page = await pdf.getPage(numPages);
    const { width } = page.getViewport({ scale: 1 });

    const [namePosition, emailPosition] = await Promise.all([
      this.findTextPosition(name, numPages - 1),
      this.findTextPosition(email, numPages - 1),
    ]);

    if (!namePosition) throw new Error(`Could not find position for name: ${name}`);
    if (!emailPosition) throw new Error(`Could not find position for email: ${email}`);

    const lineDiff = emailPosition.y - namePosition.y;

    return {
      x: namePosition.x,
      y: namePosition.y - lineDiff,
      width: width * 0.24,
      height: namePosition.height * 3,
    };
  }

  private async findTextPosition(text: string, pageIndex: number) {
    const pdf = await this.pdf;
    const page = await pdf.getPage(pageIndex + 1);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if ("str" in item && item.str.trim() === text) {
        return {
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        };
      }
    }
  }
}
