import { exportJWK, generateKeyPair, type JWK } from "jose";

type CachedJwks = {
  keys: JWK[];
};

const globalForJwks = globalThis as unknown as {
  learnguardJwks?: CachedJwks;
};

export async function getToolJwks(): Promise<CachedJwks> {
  if (process.env.LTI_PUBLIC_JWKS_JSON) {
    return JSON.parse(process.env.LTI_PUBLIC_JWKS_JSON) as CachedJwks;
  }

  if (globalForJwks.learnguardJwks) {
    return globalForJwks.learnguardJwks;
  }

  const { publicKey } = await generateKeyPair("RS256", { extractable: true });
  const jwk = await exportJWK(publicKey);
  const localJwks = {
    keys: [
      {
        ...jwk,
        kid: "learnguard-local-dev-key",
        use: "sig",
        alg: "RS256"
      }
    ]
  };

  globalForJwks.learnguardJwks = localJwks;
  return localJwks;
}
