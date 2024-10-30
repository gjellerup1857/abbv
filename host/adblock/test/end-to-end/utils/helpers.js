/**
 * Converts an array buffer byte array into a base64 string.
 *
 * @param {Uint8Array|ArrayBuffer} buffer - Byte array of any data.
 * @return {string} The same data, encoded as a base64 string.
 */
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
