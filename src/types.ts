export interface InterviewAnswers {
  spark: string;
  mvp: string;
  techStackDetails: string;
  traction: string;
  revenue: string;
  lesson: string;
}

export interface Interview {
  id: string;
  title: string;
  subtitle: string;
  founderName: string;
  founderRole?: string;
  startupName: string;
  foundedYear?: number | string;
  location: string;
  techStack?: string[];
  tags: string[];
  stats?: Array<{ label: string; value: string }>;
  accentColor?: string; // Tailwind color class like "emerald", "blue", "indigo", "amber"
  answers?: InterviewAnswers;
  body?: string;
  coverImage?: string;
  status?: string;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscriber {
  email: string;
  date: string;
  source?: string;
}

export interface Submission {
  id: string;
  founderName: string;
  startupName: string;
  email: string;
  answers: {
    spark: string;
    mvp: string;
    techStack: string;
    traction: string;
    revenue: string;
    lesson: string;
  };
  date: string;
}

export interface CommunityTopic {
  id: string;
  title: string;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
  category: "Founders & Pitch" | "Engineering & Dev" | "Featured Article Debates" | "Show & Tell" | "Coding Challenges" | "General Discussion";
  tags: string[];
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorRole?: string;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  commentCount: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  topicId: string;
  parentId?: string | null;
  content: string;
  codeSnippet?: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorRole?: string;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export interface ArticlePollOption {
  articleId: string;
  title: string;
  startupName: string;
  founderName: string;
  coverImage?: string;
  votes: number;
  votedBy: string[];
}

export interface ArticlePoll {
  id: string;
  monthTitle: string;
  description: string;
  options: ArticlePollOption[];
  totalVotes: number;
  active: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  points: number;
  description: string;
  problemStatement: string;
  sampleInput: string;
  expectedOutput: string;
  initialTemplate: string;
  submissionCount: number;
  createdAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  code: string;
  status: "PASSED" | "SUBMITTED";
  feedback?: string;
  submittedAt: string;
}

