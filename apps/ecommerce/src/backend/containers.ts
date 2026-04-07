import { container } from "bunflare";

export const PaymentGatewayContainer = container({
  defaultPort: 8080,
  onStart() {
    console.log("💳 Payment gateway container ready.");
  },
});

export const PDFInvoiceContainer = container({
  defaultPort: 3000,
  onStart() {
    console.log("📄 PDF generator container ready.");
  }
});