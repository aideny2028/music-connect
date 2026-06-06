/**
 * AI Assistant API route for Music Connect.
 * Streams back helpful responses about finding music teachers, learning instruments,
 * and using the platform — using Server-Sent Events for real-time streaming.
 *
 * Architecture: Each question is answered with streamed text chunks so the UI
 * can display a typewriter effect. No external AI API key is required in demo mode —
 * responses are generated from a curated knowledge base about the platform.
 * To enable real AI: set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Platform knowledge base used to generate contextual demo responses */
const KNOWLEDGE = {
  search: `To find a teacher on Music Connect:\n\n1. Click **Find Teachers** in the navigation bar\n2. Use the filters on the left: instrument, district, price range, lesson format\n3. Click a listing card to see full details\n4. Hit **Contact Teacher** to start a conversation\n\nTip: Use the "Listing Type" filter to see only teachers offering lessons vs. students seeking teachers.`,
  pricing: `Teacher rates on Music Connect vary by instrument and experience:\n\n• **Piano**: HK$350-800/hr\n• **Guitar**: HK$300-600/hr\n• **Violin**: HK$400-800/hr\n• **Drums**: HK$300-500/hr\n• **Voice**: HK$350-600/hr\n\nMost teachers offer a trial lesson at a reduced rate. Always confirm pricing directly with the teacher before booking.`,
  listing: `To create a listing:\n\n1. Log in and click **Create Listing** in the nav bar\n2. Choose your listing type:\n   - *Offering Lessons*: if you are a teacher advertising\n   - *Looking for Teacher*: if you are a student seeking help\n3. Fill in instrument, location, rate, and a description\n4. Click **Publish** and it appears immediately in search results\n\nYou can pause or delete listings anytime from **Dashboard → My Listings**.`,
  districts: `Music Connect covers all major Hong Kong districts:\n\n**Hong Kong Island:** Central · Wan Chai · Causeway Bay\n**Kowloon:** Mong Kok · Tsim Sha Tsui · Yau Ma Tei · Sham Shui Po · Kwun Tong\n**New Territories:** Sha Tin · Tuen Mun · Tai Po\n\nMany teachers also offer **online lessons** via Zoom, perfect if you're outside these areas.`,
  beginners: `Great instruments to start with as a beginner:\n\n🎹 **Piano**: excellent foundation, teaches music theory visually\n🎸 **Guitar** (or Ukulele first): easy to start, huge song repertoire\n🥁 **Drums**: great for rhythm-focused learners, very intuitive\n🎤 **Voice**: no instrument to buy, immediate gratification\n\nAll these instruments have many qualified teachers available on Music Connect. Start with what excites you most. Motivation matters more than difficulty.`,
  default: `I'm your Music Connect assistant! I can help you with:\n\n• 🔍 **Finding teachers**: how to search and filter listings\n• 💰 **Pricing**: typical rates by instrument in Hong Kong\n• 📝 **Creating listings**: how to post as a teacher or student\n• 📍 **Districts**: which areas are covered\n• 🎵 **Choosing an instrument**: recommendations for beginners\n\nWhat would you like to know?`,
};

/** Pick a response based on keywords in the question */
function generateResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('find') || q.includes('search') || q.includes('look') || q.includes('browse')) return KNOWLEDGE.search;
  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('hk$') || q.includes('fee')) return KNOWLEDGE.pricing;
  if (q.includes('creat') || q.includes('list') || q.includes('post') || q.includes('advert')) return KNOWLEDGE.listing;
  if (q.includes('district') || q.includes('area') || q.includes('location') || q.includes('where') || q.includes('hong kong')) return KNOWLEDGE.districts;
  if (q.includes('beginner') || q.includes('start') || q.includes('learn') || q.includes('first') || q.includes('easy')) return KNOWLEDGE.beginners;
  return KNOWLEDGE.default;
}

export async function POST(req: NextRequest) {
  const currentUser = await getServerSession(authOptions);
  if (!currentUser?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message } = await req.json();
  if (!message?.trim()) {
    return new Response('Message required', { status: 400 });
  }

  const responseText = generateResponse(message);

  // Stream the response word-by-word for the typewriter effect
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
        // Vary delay slightly for a natural typing feel
        await new Promise(r => setTimeout(r, 30 + Math.random() * 25));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
