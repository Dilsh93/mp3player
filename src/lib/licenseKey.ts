export function generateLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  function segment(): string {
    let s = "";
    for (let i = 0; i < 5; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return s;
  }
  return `${segment()}-${segment()}-${segment()}-${segment()}-${segment()}`;
}


