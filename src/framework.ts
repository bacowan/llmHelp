import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const openai = new OpenAI();

export default class Framework {
    #logger : any;
    #conversationHistory : ChatCompletionMessageParam[] = [];
    #isInitialized = false;
    #chatGptModel = "";
    #problem = "";
    #code = "";

    get isInitialized() { return this.#isInitialized; }

    setLogger(logger : any) {
        this.#logger = logger;
    }

    initialize(chatGptModel: string, problem: string, code: string) {
        this.#chatGptModel = chatGptModel;
        this.#isInitialized = true;
        this.#problem = problem;
        this.#code = code;
        this.#conversationHistory = [];
    }

    async sendPrompt(prompt: string) {
        if (this.#conversationHistory.length === 0) {
            return await this.#sendInitialPrompt(prompt);
        }
        else {
            return await this.#sendNewPrompt(prompt);
        }
    }

    async #sendInitialPrompt(question: string) : Promise<string> {
        const prompt = "I have been given the following instructions:\n"
            + this.#problem + "\n\n"
            + "I have written the following code:\n"
            + this.#code + "\n\n"
            + question + "\n"
            + "I would like you to act as a teacher: "
            + "ask me a question about why I have implemented "
            + "the code this way in order for me to come to the conclusion myself. "
            + "After that, ask me another question, and so on.";
        
        return await this.#chat(prompt);
    }

    async #sendNewPrompt(prompt: string) : Promise<string> {
        const isValid = await this.#validatePrompt(prompt);
        if (isValid) {
            const fullPrompt = prompt + "\n"
                + "Please keep helping me, and remember to act as a teacher: don't give me any explicit answers or code.";
            return this.#chat(fullPrompt);
        }
        else {
            return this.#chat("Can you please rephrase?");
        }
    }

    async #validatePrompt(prompt: string) : Promise<boolean> {
        const response = await this.#chat("Please categorize the following as it relates to what you just posted: "
                                + "\"" + prompt + "\""
                                + ". Is it: relevant, irrelevant, or relevant but incorrect? Please give a one word response.",
                                false);
        return !response.toLowerCase().includes("irrelevant");
    }

    async #chat(prompt: string, includeInHistory: boolean = true): Promise<string> {
        this.#conversationHistory.push({role: "user", content: prompt});
        const response = await openai.chat.completions.create({
            messages: this.#conversationHistory,
            model: this.#chatGptModel
        });
        const responseText = response['choices'][0]['message']['content'] ?? "";

        this.#logger.info("Prompt: " + prompt);
        this.#logger.info("Response: " + responseText);

        if (includeInHistory) {
            this.#conversationHistory.push({role: "assistant", content: responseText});
        }
        else {
            this.#conversationHistory.pop();
        }
        return responseText;
    }
}