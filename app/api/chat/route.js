// app/api/chat/route.ts (or .js)

// THIS IS THE MAGIC LINE THAT FIXES THE VERCEL TIMEOUT CUTF-OFF:
export const runtime = "edge"; 

export async function POST(req: Request) {
  // Your existing backend connection code to your Hugging Face space goes here...
  // (Whether you are using @gradio/client or standard fetch)
}
