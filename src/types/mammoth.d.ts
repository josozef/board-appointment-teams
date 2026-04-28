declare module 'mammoth/mammoth.browser' {
  interface ConvertResult {
    value: string
    messages: { type: string; message: string }[]
  }
  interface ConvertInput {
    arrayBuffer?: ArrayBuffer
    buffer?: ArrayBuffer
  }
  interface Mammoth {
    convertToHtml(input: ConvertInput): Promise<ConvertResult>
    extractRawText(input: ConvertInput): Promise<ConvertResult>
  }
  const mammoth: Mammoth
  export default mammoth
}
