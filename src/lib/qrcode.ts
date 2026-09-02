import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#2C2523',
        light: '#FAF7F2',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: 280,
      margin: 2,
      color: {
        dark: '#2C2523',
        light: '#FAF7F2',
      },
    });
  } catch (err) {
    console.error('Error generating QR SVG:', err);
    return '';
  }
}
