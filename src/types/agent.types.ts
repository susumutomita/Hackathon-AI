export interface PrizeInfo {
  sponsor: string;
  prizeName: string;
  prizeAmount?: string;
  requirements: string;
  technologies?: string[];
  judgingCriteria?: string[];
  additionalInfo?: string;
}

export interface GeneratedIdea {
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  technicalApproach: string;
  techStack: string[];
  mvpFeatures: string[];
  differentiators: string[];
  implementationPlan: {
    phase: string;
    tasks: string[];
    duration: string;
  }[];
  relatedProjects: {
    title: string;
    description: string;
    similarity: string;
    learnings: string;
  }[];
  winningProbability: number;
  evaluationScores: {
    technicalComplexity: number;
    originality: number;
    feasibility: number;
    userExperience: number;
    wowFactor: number;
  };
  suggestions: string[];
}

export interface IdeaGenerationRequest {
  prizeInfo: PrizeInfo;
  focusArea?: string;
  constraints?: string[];
  preferredTech?: string[];
}

export interface IdeaGenerationResponse {
  success: boolean;
  idea?: GeneratedIdea;
  error?: string;
  metadata?: {
    processingTime: number;
    projectsAnalyzed: number;
    trendsIdentified: string[];
  };
}
