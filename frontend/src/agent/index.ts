export interface AgentThought {
  step: number;
  message: string;
  timestamp: string;
}

export interface AgentGraphState {
  currentState: 'idle' | 'parsing' | 'executing' | 'rendering' | 'validating';
  activeTool: string | null;
  thoughts: AgentThought[];
}

export const initialAgentState: AgentGraphState = {
  currentState: 'idle',
  activeTool: null,
  thoughts: []
};
