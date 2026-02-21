import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function main() {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: "Hello" }],
            model: "llama3-8b-8192",
        });
        console.log("Success:", chatCompletion.choices[0]?.message?.content);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
