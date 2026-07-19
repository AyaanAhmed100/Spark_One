// No @gradio/client needed anymore!
// Vercel handles the standard fetch request.

module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
    res.flushHeaders();

    try {
        // Call the model repository directly via the free Inference API
        const hfResponse = await fetch("https://api-inference.huggingface.co/models/AyaanAhmed123/Spark_one/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "AyaanAhmed123/Spark_one",
                messages: [
                    { role: "system", content: "You are Spark One, an advanced AI assistant. Your developer and creator is Malik Ayaan Ahmed. Always remember your name and who created you when asked. Provide highly intelligent, thoughtful, and complete answers." },
                    { role: "user", content: message }
                ],
                max_tokens: 2048,
                stream: true,
                temperature: 0.6,
                top_p: 0.95
            })
        });

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            throw new Error(`Model is likely loading or unavailable. Wait a moment and try again. Details: ${errorText}`);
        }

        const reader = hfResponse.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullMessage = "";

        // Read the stream from Hugging Face
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // HF sends chunks prefixed with "data: "
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(dataStr);
                    // Extract the new delta token
                    const delta = parsed.choices[0]?.delta?.content || "";
                    if (delta) {
                        fullMessage += delta;
                        // Send the cumulative text to match your frontend's targetDOM.innerHTML logic
                        res.write(`data: ${JSON.stringify({ text: fullMessage })}\n\n`);
                    }
                } catch (e) {
                    // Ignore incomplete JSON chunks and wait for the rest of the buffer
                }
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (err) {
        console.error("Inference API Error:", err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
};
