export default class Framework {
    _conversationHistory : string[] = [];
    _isInitialized = false;
    _problem = "";
    _code = "";

    get isInitialized() { return this._isInitialized; }

    async initialize(problem: string, code: string) {
        this._isInitialized = true;
        this._problem = problem;
        this._code = code;
        this._conversationHistory = [];
    }

    async sendPrompt(prompt: string) {
        if (this._conversationHistory.length === 0) {
            return await this.sendInitialPrompt(prompt);
        }
        else {
            return await this.sendNewPrompt(prompt);
        }
    }

    async sendInitialPrompt(prompt: string) : Promise<string> {
        await new Promise(r => setTimeout(r, 2000));
        return "initial prompt sent";
    }

    async sendNewPrompt(prompt: string) : Promise<string> {
        await new Promise(r => setTimeout(r, 2000));
        return "new prompt sent";
    }
}