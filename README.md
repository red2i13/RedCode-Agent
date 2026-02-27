# RedCode Agent - AI Coding Assistant

A TypeScript implementation of an AI-powered coding assistant that uses Claude LLM with tool calling capabilities.

## Features

- **LLM Integration**: Uses Anthropic's Claude Haiku model via OpenRouter API
- **Tool Calling**: Supports dynamic tool execution (Read, Write files)
- **Agent Loop**: Full conversation loop for multi-step interactions
- **OpenAI-Compatible API**: Works with OpenRouter's interface

## Prerequisites

- [Bun](https://bun.sh/) v1.3 or later
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

## Installation

1. Clone and install:
```bash
git clone <repository-url>
cd claude-code-typescript
bun install
```

2. Create `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

## Usage

```bash
./your_program.sh -p "Your prompt here"
```

Examples:
```bash
./your_program.sh -p "Read app/init.py and summarize it"
./your_program.sh -p "Create a file test.txt with 'Hello World'"
```

## Architecture

The agent implements a complete loop:
1. User sends prompt
2. LLM decides if tools are needed  
3. Execute Read/Write tools
4. Send results back to LLM
5. Return final response

## Configuration

**Environment Variables:**
- `OPENROUTER_API_KEY`: Required for API access
- `OPENROUTER_BASE_URL`: Custom endpoint (optional)
- `IS_LOCAL`: Set to `"true"` for local testing

**Models:**
- Production: `anthropic/claude-haiku-4.5`
- Testing: `openai/gpt-oss-120b:free` (when `IS_LOCAL=true`)

## Development

```bash
bun run app/main.ts -p "Your prompt"
```

## Dependencies

- openai - API client
- dotenv - Environment variables
- @dotenvx/dotenvx - Enhanced dotenv
- ora - CLI spinner
- figlet - ASCII art

## Common Issues

**401 Authentication Error**: Check your API key in `.env`

**400 Provider Error**: Verify model name and tools schema format

**File Errors**: Check file paths and permissions

## Learn More

- [OpenRouter Docs](https://openrouter.ai/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Claude Docs](https://docs.anthropic.com/)
- [Bun Docs](https://bun.sh/docs)
- [CodeCrafters Challenge](https://codecrafters.io/challenges/claude-code)

## License

MIT
