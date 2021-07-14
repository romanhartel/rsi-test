export default class DecodeEncode
{
    static encode(decoded: string | undefined): Uint8Array
    {
        const encoder: TextEncoder = new TextEncoder();

        return encoder.encode(decoded);
    }

    static decode(encoded: ArrayBuffer): string
    {
        const decoder: TextDecoder = new TextDecoder();

        return decoder.decode(encoded);
    }
}
