declare module 'blind-signatures' {
  interface KeyPair {
    keyPair: {
      n: bigint;
      e: bigint;
      d: bigint;
      p: bigint;
      q: bigint;
    };
  }

  interface BlindedMessage {
    blinded: bigint;
    r: bigint;
  }

  interface KeyGenOptions {
    b: number;
  }

  interface BlindParams {
    message: string | bigint;
    N: string | bigint;
    E: string | bigint;
  }

  interface SignParams {
    blinded: string | bigint;
    key: KeyPair;
  }

  interface UnblindParams {
    signed: string | bigint;
    r: string | bigint;
    N: string | bigint;
  }

  interface VerifyParams {
    unblinded: string | bigint;
    message: string | bigint;
    N: string | bigint;
    E: string | bigint;
  }

  const BlindSignature: {
    keyGeneration(options: KeyGenOptions): KeyPair;
    messageToHash(message: string): bigint;
    blind(params: BlindParams): BlindedMessage;
    sign(params: SignParams): bigint;
    unblind(params: UnblindParams): bigint;
    verify(params: VerifyParams): boolean;
  };

  export default BlindSignature;
}
