import OpenAI from "openai";
import { exec } from 'node:child_process';
import { json } from "stream/consumers";
import { exit, stderr } from "node:process";
import { error } from "node:console";
import ora from 'ora';
import figlet from 'figlet';

// require('dotenv').config({ silent: true });

async function main() {
  console.clear();
  console.log(figlet.textSync('Red Code Agent', 'Slant'));
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }
  const tools : OpenAI.Chat.Completions.ChatCompletionTool[]= [
      {
        "type": "function",
        "function": {
          "name": "Read",
          "description": "Read and return the contents of a file",
          "parameters": {
            "type": "object",
            "properties": {
              "file_path": {
                "type": "string",
                "description": "The path to the file to read"
              }
            },
            "required": ["file_path"]
          }
        }
    },
    {
      "type": "function",
      "function": {
        "name": "Write",
        "description": "Write content to a file",
        "parameters": {
          "type": "object",
          "required": ["file_path", "content"],
          "properties": {
            "file_path": {
              "type": "string",
              "description": "The path of the file to write to"
            },
            "content": {
              "type": "string",
              "description": "The content to write to the file"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "Bash",
        "description": "Execute a shell command",
        "parameters": {
          "type": "object",
          "required": ["command"],
          "properties": {
            "command": {
              "type": "string",
              "description": "The command to execute"
            }
          }
        }
      }
    }
  ];
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
  let output : string ;
  let model = process.env.IS_LOCAL === "true" ? "openai/gpt-oss-20b:free" : "anthropic/claude-haiku-4.5";
  let msg_arr : OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  msg_arr.push({ role: "user", content: prompt });
  const spinner = ora('Contacting Anthropic API...').start();
  let response = await client.chat.completions.create({
    model: model,
    messages: msg_arr,
    tools: tools,
    tool_choice: "auto", // The model decides if a tool is needed
  });
  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  // console.error("Logs from your program will appear here!");

  // TODO: Uncomment the lines below to pass the first stage
    //parse response
    let toolCalls : OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined = response?.choices?.[0]?.message?.tool_calls;
    
    // Push the first assistant response BEFORE the loop
    if (response.choices[0].message.content || response.choices[0].message.tool_calls) {
      msg_arr.push({
        role: "assistant",
        content: response.choices[0].message.content,
        tool_calls: response.choices[0].message.tool_calls
      });
    }
    
    while(toolCalls && toolCalls.length > 0){
      //init the loop
      for (const toolCall of toolCalls){
        
      if (toolCall.type === "function" && toolCall.function?.name === "Read"){
        const args = JSON.parse(toolCall.function.arguments);
        const pathRead = args["file_path"];
        output = await new Promise<string>((resolve, reject) => {
          exec("cat " + pathRead, (err, stdout, stderr)=>{
            if(err){
              console.error(err.message);
              spinner.fail('Error when excuting command');
              reject(err);
              return;
            }
            else if (stderr)
            {
              console.log(`${stderr}`);
              spinner.fail('Error when excuting command');
              reject(new Error(stderr));
              return;
            }
            resolve(`${stdout}`);
            });
          });
        msg_arr.push({role: "tool", tool_call_id: toolCall.id ,content: output});
      }
      else if (toolCall.type === "function" && toolCall.function?.name === "Bash"){
        const args = JSON.parse(toolCall.function.arguments);
        const cmd = args["command"];
        output = await new Promise<string>((resolve, reject) => {
          exec(cmd, (err, stdout, stderr)=>{
            if(err){
              console.error(err.message);
              spinner.fail('Error when excuting command');
              reject(err);
              return;
            }
            else if (stderr)
            {
              console.log(`${stderr}`);
              spinner.fail('Error when excuting command');
              reject(new Error(stderr));
              return;
            }
            resolve(`${stdout}`);
            });
          });
        msg_arr.push({role: "tool", tool_call_id: toolCall.id ,content: output});
      }
      else if (toolCall.type === "function" && toolCall.function?.name === "Write"){
        const args = JSON.parse(toolCall.function.arguments);
        const pathWrite = args["file_path"];
        const contentToWrite = args["content"];
        output = await new Promise<string>((resolve, reject) => {
          let is_there :string;
          exec("find " , (err, stdout, stderr)=>{
            if(err){
              console.error(err.message);
              reject(err);
              spinner.fail('Error when excuting command');
              return;
            }
            else if (stderr)
            {
              console.log(`${stderr}`);
              reject(new Error(stderr));
              spinner.fail('Error when excuting command');
              return;
            }
            is_there  = `${stdout}`;
          });
          const cmd : string = "echo " + "'" + contentToWrite + "'" + " > " + pathWrite;
          exec(cmd , (err, stdout, stderr)=>{
            if(err){
              console.error(err.message);
              spinner.fail('Error when excuting command');
              reject(err);
              return;
            }
            else if (stderr)
            {
              console.log(`${stderr}`);
              spinner.fail('Error when excuting command');
              reject(new Error(stderr));
              return;
            }
            resolve(!is_there ? "File successfully created at " + pathWrite : "Updated existing file at " + pathWrite);
            });
          });
   
        msg_arr.push({role: "tool", tool_call_id: toolCall.id ,content: output});
      }
      }
      //call request and update toolCall
      response = await client.chat.completions.create({
        model: model,
        messages: msg_arr,
        tools: tools,
        tool_choice: "auto", // The model decides if a tool is needed
      });
      // console.log("response time ");
      msg_arr.push({
        role: "assistant",
        content: response.choices[0].message.content,
        tool_calls: response.choices[0].message.tool_calls
      });
      toolCalls  = response?.choices?.[0]?.message?.tool_calls;
  }
  spinner.succeed('Response received:');
  console.log(response.choices[0].message.content);
}

main();
