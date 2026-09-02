import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const origin = new URL(request.url).origin;
    const targetUrl = `${origin}/g/${token}`;

    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#2C2523',
        light: '#FFFFFF',
      },
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return new NextResponse('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
      status: 500,
    });
  }
}
