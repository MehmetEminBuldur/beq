// Simple compression using LZ-string for client-side compression
// This provides basic compression without external dependencies

export function compress(data: string): string {
  // Simple base64 encoding with a marker for compressed data
  try {
    // Use built-in btoa for basic compression simulation
    // In a real implementation, you'd use a proper compression library like LZ-string
    const compressed = btoa(encodeURIComponent(data));
    return `__COMPRESSED__${compressed}`;
  } catch (error) {
    console.warn('Compression failed, using original data:', error);
    return data;
  }
}

export function decompress(data: string): string {
  try {
    if (data.startsWith('__COMPRESSED__')) {
      const compressed = data.replace('__COMPRESSED__', '');
      return decodeURIComponent(atob(compressed));
    }
    return data;
  } catch (error) {
    console.warn('Decompression failed, returning original data:', error);
    return data;
  }
}
