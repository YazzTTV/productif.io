import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { checkoutUrl } = await req.json();
    
    console.log('Received redirect request to:', checkoutUrl);
    
    if (!checkoutUrl || typeof checkoutUrl !== 'string' || !checkoutUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid checkout URL' }, { status: 400 });
    }
    
    // Renvoyer une réponse avec l'URL pour la redirection
    return NextResponse.json({ 
      redirectUrl: checkoutUrl,
      status: 'success' 
    });
  } catch (error) {
    console.error('Error in payment redirect:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 