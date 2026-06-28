// Stub file - DM features not yet implemented
export interface DMMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: string;
  receiver: string;
}

export class DMInterceptor {
  constructor() {}
  
  init() {}
  
  getDMMessages() {
    return [];
  }
}
