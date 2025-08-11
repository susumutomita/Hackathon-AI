import "dotenv/config";
import { PrizeInfo } from "@/types/agent.types";

async function testIdeaGeneration() {
  console.log("🚀 Testing Idea Generation API...\n");

  // テスト用のプライズ情報
  const testPrizeInfo: PrizeInfo = {
    sponsor: "Worldcoin",
    prizeName: "Most Innovative World ID Integration",
    prizeAmount: "$5,000",
    requirements:
      "Build an innovative solution that leverages World ID for identity verification. Your project should demonstrate a novel use case for privacy-preserving proof of personhood, creating value for users while maintaining their privacy. Focus on real-world applications that can scale globally.",
    technologies: [
      "World ID",
      "Next.js",
      "Smart Contracts",
      "Zero-Knowledge Proofs",
    ],
    judgingCriteria: [
      "Innovation in World ID usage",
      "Technical implementation quality",
      "User experience and interface design",
      "Scalability and real-world applicability",
      "Privacy preservation approach",
    ],
    additionalInfo:
      "Bonus points for integrating with other Web3 protocols and creating network effects",
  };

  const requestBody = {
    prizeInfo: testPrizeInfo,
    focusArea: "Decentralized Identity and Privacy",
    constraints: [
      "Must be implementable in 48 hours",
      "Should have a working demo",
      "Must preserve user privacy",
    ],
    preferredTech: ["React", "TypeScript", "Ethereum"],
  };

  try {
    console.log("📤 Sending request to /api/generate-winning-idea");
    console.log("Prize:", testPrizeInfo.sponsor, "-", testPrizeInfo.prizeName);
    console.log(
      "Requirements:",
      testPrizeInfo.requirements.substring(0, 100) + "...\n",
    );

    const response = await fetch(
      "http://localhost:3000/api/generate-winning-idea",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.idea) {
      console.log("✅ Successfully generated winning idea!\n");
      console.log("=".repeat(60));
      console.log("🏆 GENERATED IDEA");
      console.log("=".repeat(60));
      console.log(`\n📌 Title: ${result.idea.title}`);
      console.log(`📝 Description: ${result.idea.description}`);
      console.log(`\n🎯 Problem Statement:\n${result.idea.problemStatement}`);
      console.log(`\n💡 Solution:\n${result.idea.solution}`);
      console.log(`\n🛠️ Tech Stack: ${result.idea.techStack.join(", ")}`);

      console.log("\n📊 MVP Features:");
      result.idea.mvpFeatures.forEach((feature: string, index: number) => {
        console.log(`  ${index + 1}. ${feature}`);
      });

      console.log("\n🎨 Differentiators:");
      result.idea.differentiators.forEach((diff: string, index: number) => {
        console.log(`  ${index + 1}. ${diff}`);
      });

      console.log("\n📈 Evaluation Scores:");
      console.log(
        `  - Technical Complexity: ${result.idea.evaluationScores.technicalComplexity}/10`,
      );
      console.log(
        `  - Originality: ${result.idea.evaluationScores.originality}/10`,
      );
      console.log(
        `  - Feasibility: ${result.idea.evaluationScores.feasibility}/10`,
      );
      console.log(
        `  - User Experience: ${result.idea.evaluationScores.userExperience}/10`,
      );
      console.log(
        `  - Wow Factor: ${result.idea.evaluationScores.wowFactor}/10`,
      );

      console.log(
        `\n🎲 Winning Probability: ${result.idea.winningProbability}%`,
      );

      if (
        result.idea.implementationPlan &&
        result.idea.implementationPlan.length > 0
      ) {
        console.log("\n📅 Implementation Plan:");
        result.idea.implementationPlan.forEach((phase: any) => {
          console.log(`  ${phase.phase} (${phase.duration}):`);
          phase.tasks.forEach((task: string) => {
            console.log(`    - ${task}`);
          });
        });
      }

      if (
        result.idea.relatedProjects &&
        result.idea.relatedProjects.length > 0
      ) {
        console.log("\n🔗 Related Projects (Reference):");
        result.idea.relatedProjects
          .slice(0, 3)
          .forEach((project: any, index: number) => {
            console.log(`  ${index + 1}. ${project.title}`);
            console.log(`     ${project.description.substring(0, 100)}...`);
          });
      }

      if (result.idea.suggestions && result.idea.suggestions.length > 0) {
        console.log("\n💭 Success Tips:");
        result.idea.suggestions.forEach((suggestion: string, index: number) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }

      if (result.metadata) {
        console.log("\n📊 Metadata:");
        console.log(`  - Processing Time: ${result.metadata.processingTime}ms`);
        console.log(
          `  - Projects Analyzed: ${result.metadata.projectsAnalyzed}`,
        );
        console.log(
          `  - Trends Identified: ${result.metadata.trendsIdentified?.join(", ") || "N/A"}`,
        );
      }

      console.log("\n" + "=".repeat(60));
      console.log("🎉 Ready to win the hackathon!");
      console.log("=".repeat(60));
    } else {
      console.error("❌ Failed to generate idea:", result.error);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// 別のテストケース: シンプルなプライズ情報
async function testSimplePrize() {
  console.log("\n\n🧪 Testing with simple prize info...\n");

  const simplePrize: PrizeInfo = {
    sponsor: "Ethereum Foundation",
    prizeName: "Best Public Good",
    requirements:
      "Create a solution that benefits the entire Ethereum ecosystem and provides value as a public good",
  };

  try {
    const response = await fetch(
      "http://localhost:3000/api/generate-winning-idea",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prizeInfo: simplePrize }),
      },
    );

    const result = await response.json();

    if (result.success) {
      console.log("✅ Simple test passed!");
      console.log(`Generated idea: ${result.idea.title}`);
      console.log(`Winning probability: ${result.idea.winningProbability}%`);
    } else {
      console.error("❌ Simple test failed:", result.error);
    }
  } catch (error: any) {
    console.error("❌ Error in simple test:", error.message);
  }
}

if (require.main === module) {
  console.log("=".repeat(60));
  console.log("   🤖 HACKATHON WINNING IDEA GENERATOR TEST");
  console.log("=".repeat(60));

  testIdeaGeneration()
    .then(() => testSimplePrize())
    .then(() => {
      console.log("\n✅ All tests completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { testIdeaGeneration };
