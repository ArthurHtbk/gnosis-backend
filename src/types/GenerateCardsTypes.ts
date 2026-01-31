export interface GenerateFromTextBody {
  title: string;
  content: string;
}

// Chaque carte retournée par le LLM
export interface LlmCard {
  question: string;
  answers: string[];
  rightAnswer: string; // côté LLM on reçoit toujours le texte
}

// Après transformation côté backend, on stockera l'index dans la DB
export interface LlmResponse {
  cards: LlmCard[];
}
