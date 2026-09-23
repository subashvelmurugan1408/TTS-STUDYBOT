export type Role = "user" | "bot";

export interface Message {
  id: string;
  role: Role;
  text: string;
  spokenExplanation?: string;
  timestamp: Date;
}