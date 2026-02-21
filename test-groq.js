import Groq from "groq-sdk";
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY, // Your Vite env variable
  dangerouslyAllowBrowser: true // REQUIRED for frontend testing
});
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
