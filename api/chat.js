const { Client } = require("@gradio/client");

// ⚠️ CHANGE THIS: Put your actual Hugging Face SPACE path here!
// Example: "AyaanAhmed123/spark-one-space"
const HF_SPACE_PATH = "AyaanAhmed123/Spark_one"; 

module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    // Direct instructions for Vercel to allow immediate downstream chunk delivery
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
    res.flushHeaders();

    try {
        // Warning fallback notice to help you debug during configuration setup
        if (HF_SPACE_PATH === "AyaanAhmed123/Spark_one") {
            res.write(`data: ${JSON.stringify({ text: "⚠️ **Configuration Warning:** You need to open `api/chat.js` and change the `HF_SPACE_PATH` string to point to your live Hugging Face **Space**, not the raw model repo weights." })}\n\n`);
        }

        // Establish connection to Gradio engine inside HF Space container
        const client = await Client.connect(HF_SPACE_PATH);
        
        // Call the endpoint using correct positional mapping arrays
        const submission = client.submit("/chat", [message]);

        for await (const msg of submission) {
            if (msg.type === "data") {
                // Stream the current snapshot back down to the browser UI
                const outputText = msg.data[0];
                res.write(`data: ${JSON.stringify({ text: outputText })}\n\n`);
            }
        }
        
        res.write("data: [DONE]\n\n");
        res.end();
        
    } catch (err) {
        console.error("Connection framework error:", err);
        res.write(`data: ${JSON.stringify({ error: `Could not reach backend: ${err.message}. Please verify your Hugging Face Space name is correct in api/chat.js.` })}\n\n`);
        res.end();
    }
};
