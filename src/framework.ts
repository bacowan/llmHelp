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
    #inputTokens = 0;
    #outputTokens = 0;

    get isInitialized() { return this.#isInitialized; }

    setLogger(logger : winston.Logger) {
        this.#logger = logger;
    }

    #stripExclude(code: string): string {
        const index = code.indexOf("# exclude");
        if (index === -1) {
            return code;
        }
        else {
            const test = code.substring(0, index);
            return test;
        }
    }

    initialize(problem: { Description: string, Title: string }, chatGptModel: string, responseConsensusSteps: number = 3) {
        this.#chatGptModel = chatGptModel;
        this.#isInitialized = true;
        this.#problem = problem;
        this.#conversationHistory = [];
        this.#responseConsensusSteps = responseConsensusSteps;
        this.#logger?.info("chatGptModel set to " + chatGptModel, { tags: "initializing" });
        this.#logger?.info("Problem set to " + problem.Title, { tags: "initializing" });
    }

    async sendPrompt(prompt: string, code: string) {
        if (this.#conversationHistory.length === 0) {
            return await this.#sendInitialPrompt(prompt, code);
        }
        else {
            return await this.#sendNewPrompt(prompt, code);
        }
    }

    async #sendInitialPrompt(question: string, code: string) : Promise<string> {
        this.#code = this.#stripExclude(code);
        const system_prompt = "I have been given the following instructions:\n"
            + this.#problem.Description + "\n\n"
            + "I have written the following code:\n"
            + this.#code + "\n\n"
            + "I would like you to act as a teacher: "
            + "ask me a question about why I have implemented "
            + "the code this way in order for me to come to the conclusion myself. "
            + "To do so, I would like you to use the following techniques:\n"
            + "- Reframe: Teacher rephrases a student answer to improve expression. For example:\n"
            + "  - Teacher: What does the sum function do?"
            + "  - Student: It sums the values of the dictionary."
            + "  - Teacher: It sums the values, as opposed to the keys, right?"
            + "- Reframe scientifically: Teacher rephrases student answer to correct science. For example:\n"
            + "  - Teacher: What does the code that starts with `public class MyClass` do?"
            + "  - Student: That defines a new object called 'MyClass'"
            + "  - Teacher: It defines a new class called 'MyClass'"
            + "- Elaborate: Teacher asks for elaboration of a response (to say more about it). For example:\n"
            + "  - Teacher: What sort of issues arise if you remove this statement?"
            + "  - Student: It errors."
            + "  - Teacher: How come? What error?"
            + "- Prompt and scaffold: Teacher provides cues before or after a question to prompt/scaffold student's responses. For example:\n"
            + "  - Teacher: Do you think a pointer or a reference would work better here?"
            + "  - Student: I'm not too sure."
            + "  - Teacher: Remember how I mentioned earlier the differences between them. Think about those."
            + "- Refocus: Teacher summarises to consolidate and refocus the discussion. For example:\n"
            + "  - Teacher: So to summarize what we've gone over so far..."
            + "- Teacher uptake: Teacher asks a follow-up question that includes (builds on) part of a previous answer. For example:"            + "  - Teacher: Why did you use a list here?"
            + "  - Student: So that I can add items to it."
            + "  - Teacher: Are there any other properties of lists that might come in useful?";
        this.#conversationHistory.push({role: "system", content: system_prompt});

        return await this.#chat(question, true, false);
    }

    async #sendNewPrompt(prompt: string, code: string) : Promise<string> {
        const newCode = this.#stripExclude(code);
        let fullPrompt = prompt + "\n"
            + "Please keep helping me, and remember to act as a teacher: don't give me any explicit answers or code.";
        if (this.#code !== newCode) {
            this.#code = newCode;
            fullPrompt += "\n\nNote that I have changed my code to the following:\n\n" + newCode;
        }
        return this.#chat(fullPrompt);
    }

    async #createChatCompletion(values: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
        const response = await openai.chat.completions.create({
            messages: values,
            model: this.#chatGptModel
        });
        if (response.usage !== undefined && response.usage !== null) {
            this.#inputTokens += response.usage.prompt_tokens;
            this.#outputTokens += response.usage.completion_tokens;
        }
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
        this.#logger?.info(`total_input_tokens: ${this.#inputTokens}; total_output_tokens: ${this.#outputTokens}`, { tags: "tokens" });

        return response;
    }
}