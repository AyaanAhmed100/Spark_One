const { Client } = require("@gradio/client");

module.exports = async function (req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
    res.flushHeaders();

    try {
        // Connect to your specific Hugging Face ZeroGPU space
        const client = await Client.connect("AyaanAhmed123/Spark_one");
        
        // Submit the user's message to the /chat endpoint setup in your app.py
        const submission = client.submit("/chat", { message });

        // Listen for chunks streaming from Hugging Face
        for await (const msg of submission) {
            if (msg.type === "data") {
                // Instantly pipe the model's text generation back to the frontend UI
                const chunk = JSON.stringify({ text: msg.data[0] });
                res.write(`data: ${chunk}\n\n`);
            }
        }
        
        // Notify the frontend that generation is completely finished
        res.write("data: [DONE]\n\n");
        res.end();
        
    } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
};
