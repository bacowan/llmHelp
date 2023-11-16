import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import winston from 'winston';

const openai = new OpenAI();

export default class Framework {
    #logger : winston.Logger | null = null;
    #conversationHistory : ChatCompletionMessageParam[] = [];
    #isInitialized = false;
    #chatGptModel = "";
    #problem: { Description: string, Title: string } = { Description: "", Title: "" };
    #code = "";
    #responseConsensusSteps: number = 3;

    get isInitialized() { return this.#isInitialized; }

    setLogger(logger : winston.Logger) {
        this.#logger = logger;
    }

    initialize(problem: { Description: string, Title: string }, code: string, chatGptModel: string, responseConsensusSteps: number = 3) {
        this.#chatGptModel = chatGptModel;
        this.#isInitialized = true;
        this.#problem = problem;
        this.#code = code;
        this.#conversationHistory = [];
        this.#responseConsensusSteps = responseConsensusSteps;
        this.#logger?.info("chatGptModel set to " + chatGptModel, { tags: "initializing" });
        this.#logger?.info("Problem set to " + problem.Title, { tags: "initializing" });
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
            + this.#problem.Description + "\n\n"
            + "I have written the following code:\n"
            + this.#code + "\n\n"
            + question + "\n"
            + "I would like you to act as a teacher: "
            + "ask me a question about why I have implemented "
            + "the code this way in order for me to come to the conclusion myself. "
            + "After that, ask me another question, and so on.";
        
        return await this.#chat(prompt, true, false);
    }

    async #sendNewPrompt(prompt: string) : Promise<string> {
        const isValid = true;//await this.#validatePrompt(prompt);
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

    async #createChatCompletion(values: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
        const response = await openai.chat.completions.create({
            messages: values,
            model: this.#chatGptModel
        });
        return response['choices'][0]['message']['content'] ?? "";
    }

    async #responseConsensusStep(prompt: string): Promise<string> {
        const tempConversationHistory = [...this.#conversationHistory];
        tempConversationHistory.push({role: "user", content: prompt});
        return await this.#createChatCompletion(tempConversationHistory);
    }

    async #responseConsensus(prompt: string) {
        const responses = [];
        for (let i = 0; i < this.#responseConsensusSteps; i++) {
            const response = await this.#responseConsensusStep(prompt);
            responses.push(response);
            this.#logger?.info(`${i + 1}: ${response}`, { tags: "consensus-response" });
        }
        let consensusPrompt = "I have been given the following responses to a prompt that I submitted. I want to select a prompt that best matches the other prompts. Please give me the number of that prompt, and respond with only the number.";
        for (let i = 0; i < this.#responseConsensusSteps; i++) {
            consensusPrompt += `\n${i + 1}. ${responses[i]}`;
        }
        const consensusResponse = await this.#createChatCompletion([{role: "user", content: consensusPrompt}]);
        this.#logger?.info(consensusResponse, { tags: "consensus-resolution-response" });
        const match = consensusResponse.match(/\d+/);
        let consensusIndex = 0;
        if (match) {
            consensusIndex = parseInt(match[0], 10) - 1;
        }
        if (consensusIndex < responses.length) {
            return responses[consensusIndex];
        }
        else {
            return responses[0];
        }
    }

    async #chat(prompt: string, includeInHistory: boolean = true, useConsensus: boolean = true): Promise<string> {
        let response: string;
        if (useConsensus) {
            response = await this.#responseConsensus(prompt);
        }
        else {
            const tempConversationHistory = [...this.#conversationHistory];
            tempConversationHistory.push({role: "user", content: prompt});
            response = await this.#createChatCompletion(tempConversationHistory);
        }
        if (includeInHistory) {
            this.#conversationHistory.push({role: "user", content: prompt});
            this.#conversationHistory.push({role: "assistant", content: response});
        }

        this.#logger?.info(prompt, { tags: "prompt" });
        this.#logger?.info(response, { tags: "response" });

        return response;
    }
}