// Stub file - DM analysis features not yet implemented
export interface Conversation {
  id: string;
  participants: string[];
  messages: any[];
}

export interface Category {
  name: string;
  score: number;
}

export class DMAnalyzer {
  constructor() {}
  
  analyzeConversation(conversation: Conversation) {
    return {
      category: 'unknown',
      score: 0,
    };
  }
  
  getCategories(): Category[] {
    return [];
  }
}
