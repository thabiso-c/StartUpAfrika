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
  founderRole: string;
  startupName: string;
  foundedYear: number;
  location: string;
  techStack: string[];
  tags: string[];
  stats: Array<{ label: string; value: string }>;
  accentColor: string; // Tailwind color class like "emerald", "blue", "indigo", "amber"
  answers: InterviewAnswers;
}

export interface Subscriber {
  email: string;
  date: string;
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
