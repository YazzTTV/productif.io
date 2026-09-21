declare module "qrcode" {
  type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

  interface ToStringOptions {
    type?: "svg" | "utf8" | "terminal"
    errorCorrectionLevel?: ErrorCorrectionLevel
    margin?: number
    width?: number
  }

  const QRCode: {
    toString(text: string, options?: ToStringOptions): Promise<string>
  }

  export default QRCode
}
