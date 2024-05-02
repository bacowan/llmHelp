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
    #recommendedResponseRole: string | null = null;
    #inputTokens = 0;
    #outputTokens = 0;
    #lang : { [key: string]: { [lang: string]: string } } = {};
    #userLanguage : "En" | "Jp" = "En";
    #useFramework : boolean = true;

    get isInitialized() { return this.#isInitialized; }

    setLogger(logger : winston.Logger) {
        this.#logger = logger;
    }

    #stripExclude(code: string): string {
        const lines = code.split("\n");
        let ret : String[] = [];
        let excluding = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith("# exclude_start") || line.startsWith("// exclude_start")) {
                excluding = true;
            }
            else if (line.startsWith("# exclude_stop") || line.startsWith("// exclude_stop")) {
                excluding = false;
            }
            else if (!excluding) {
                ret.push(line);
            }
        }
        return ret.join("\n");
    }

    initialize(problem: { Description: string, Title: string }, chatGptModel: string, userLanguage: "En" | "Jp", lang : { [key: string]: { [lang: string]: string } }, recommendedResponseRole: string | null, useFramework: boolean, responseConsensusSteps: number = 3) {
        this.#chatGptModel = chatGptModel;
        this.#isInitialized = true;
        this.#problem = problem;
        this.#conversationHistory = [];
        this.#userLanguage = userLanguage;
        this.#lang = lang;
        this.#useFramework = useFramework;
        this.#recommendedResponseRole = recommendedResponseRole;
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
        let system_prompt = this.#lang["IHaveBeenGivenTheFollowingInstructions"][this.#userLanguage] + "\n"
            + this.#problem.Description + "\n\n"
            + this.#lang["IHaveWrittenFollowingCode"][this.#userLanguage] + "\n"
            + this.#code
        if (this.#useFramework) {
            system_prompt += "\n\n" + this.#lang["LLMSystemInstructions"][this.#userLanguage];
        }
        this.#conversationHistory.push({role: "system", content: system_prompt});

        return await this.#chat(question, true, false);
    }

    async #sendNewPrompt(prompt: string, code: string) : Promise<string> {
        if (this.#recommendedResponseRole !== null && prompt === "x") {
            return await this.#recommendResponse();
        }
        else {
            const newCode = this.#stripExclude(code);
            let fullPrompt = prompt;
            if (this.#useFramework) {
                fullPrompt += "\n" + this.#lang["ActAsATeacher"][this.#userLanguage];
            }
            if (this.#code !== newCode) {
                this.#code = newCode;
                fullPrompt += "\n\n" + this.#lang["CodeChanges"][this.#userLanguage] + "\n\n" + newCode;
            }
            return await this.#chat(fullPrompt, true, this.#useFramework);
        }
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
        let consensusPrompt = this.#lang["ConsensusRequest"][this.#userLanguage];
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

    async #recommendResponse(): Promise<string> {
        if (this.#recommendedResponseRole !== null) {
            const values = this.#conversationHistory.filter(m => m.role !== "system");
            values.push({
                role: "user",
                content: "Give me a sample response, but pretend you're a student who's "
                    + this.#recommendedResponseRole
                    + ". Do so by completing the statement : \" My answer to your question is as follows :\""
            });
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
        else {
            return "";
        }
    }

    async #chat(prompt: string, includeInHistory: boolean, useConsensus: boolean): Promise<string> {
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

        /*let responseArray = response.split("\n");
        if (this.#recommendedResponseRole !== null) {
            return responseArray.concat("", await this.#recommendResponse());
        }
        else {
            return responseArray;
        }*/
        if (this.#recommendedResponseRole !== null) {
            return response + "\n\n" + await this.#recommendResponse();
        }
        else {
            return response;
        }
    }
}