import { Anima } from "./sdk/src/anima";
import type { SSEGetCodeFromPromptMessage } from "./sdk/src/types";

const anima = new Anima({
  auth: {
    token: process.env.ANIMA_TOKEN || "",
    teamId: process.env.ANIMA_TEAM_ID || ""
  },
  apiBaseAddress: process.env.ANIMA_API_URL,
});

async function testSimpleP2C() {
  console.log("🚀 Simple P2C Test with detailed SSE logging\n");

  const prompt = "Create a button component";
  console.log("📝 Prompt:", prompt);

  let messageCount = 0;
  const handler = (message: SSEGetCodeFromPromptMessage) => {
    messageCount++;
    console.log(`\n📨 [Message ${messageCount}] Type: ${message.type}`);

    switch (message.type) {
      case "queueing":
        console.log("   └─ Status: Queued for processing");
        break;
      case "start":
        console.log(`   └─ Session ID: ${message.sessionId}`);
        break;
      case "generating_code":
        console.log(`   └─ Status: ${message.payload.status}`);
        console.log(`   └─ Progress: ${message.payload.progress}%`);
        if (message.payload.files) {
          console.log(
            `   └─ Files: ${Object.keys(message.payload.files).join(", ")}`
          );
        }
        break;
      case "generation_completed":
        console.log("   └─ Status: Generation completed");
        break;
      case "done":
        console.log(`   └─ Session ID: ${message.payload.sessionId}`);
        console.log(`   └─ Token Usage: ${message.payload.tokenUsage}`);
        break;
      case "error":
        console.log(`   └─ Error: ${message.payload.errorName}`);
        console.log(`   └─ Reason: ${message.payload.reason}`);
        break;
      default:
        console.log(`   └─ Data:`, message);
    }
  };

  try {
    console.log("\n🔄 Starting generation...\n");

    const result = await anima.generateCodeFromPrompt(
      {
        prompt,
        settings: {
          framework: "react",
          language: "typescript",
          styling: "tailwind",
        },
        assetsStorage: { strategy: "host" },
      },
      handler
    );

    console.log("\n✅ Generation successful!");
    console.log("\n📊 Final Result:");
    console.log(`   ├─ Session ID: ${result.sessionId}`);
    console.log(`   ├─ Token Usage: ${result.tokenUsage}`);
    console.log(`   └─ Files Generated: ${Object.keys(result.files).length}`);

    console.log("\n📁 Files:");
    Object.entries(result.files).forEach(([fileName, file]) => {
      console.log(`   ├─ ${fileName}`);
      console.log(`   │  └─ Size: ${file.content.length} chars`);
    });

    const firstFile = Object.entries(result.files)[0];
    if (firstFile) {
      const [fileName, file] = firstFile;
      console.log(`\n📄 Preview of ${fileName}:`);
      console.log("─".repeat(50));
      console.log(file.content.substring(0, 300) + "...");
      console.log("─".repeat(50));
    }
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(`   ├─ Error: ${error.message}`);
    if (error.detail) {
      console.error(`   ├─ Details:`, error.detail);
    }
    if (error.status) {
      console.error(`   └─ Status: ${error.status}`);
    }
  }
}

// Run the test
testSimpleP2C()
  .then(() => {
    console.log("\n✨ Test completed");
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
  });
