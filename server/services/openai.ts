import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface StudyResourceRecommendation {
  resourceType: string;
  title: string;
  description: string;
  url?: string;
  relevanceScore: number;
}

export async function getStudyResourceRecommendations(
  subject: string,
  topic: string,
  userLevel: string
): Promise<StudyResourceRecommendation[]> {
  try {
    const prompt = `You are an AI study assistant for VIT Chennai students. 
    Provide study resource recommendations for the following:
    - Subject: ${subject}
    - Topic: ${topic}  
    - Student Level: ${userLevel}
    
    Please recommend 5 different types of study resources with practical URLs when possible.
    Focus on resources that are freely available and suitable for engineering students.
    
    Respond with a JSON array containing objects with these fields:
    - resourceType (e.g., "Video Tutorial", "Documentation", "Practice Problems", "Research Paper", "Online Course")
    - title (specific resource name)
    - description (brief explanation of why it's helpful)
    - url (actual URL if available, or "Search for: [search terms]" if not)
    - relevanceScore (1-10 based on how relevant it is)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant for engineering students. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error getting study recommendations:", error);
    return [];
  }
}

export async function answerStudyQuestion(question: string, context?: string): Promise<string> {
  try {
    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nPlease provide a helpful answer for this VIT Chennai student.`
      : `Question: ${question}\n\nPlease provide a helpful answer for this VIT Chennai engineering student.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI study assistant for VIT Chennai engineering students. Provide clear, accurate, and educational responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response right now.";
  } catch (error) {
    console.error("Error answering study question:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}

export async function generateStudyPlan(
  subjects: string[],
  timeAvailable: string,
  goals: string
): Promise<string> {
  try {
    const prompt = `Create a personalized study plan for a VIT Chennai student with:
    - Subjects: ${subjects.join(", ")}
    - Time Available: ${timeAvailable}
    - Goals: ${goals}
    
    Please provide a structured weekly study plan with specific time allocations, study techniques, and milestones.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert study planner for engineering students. Create detailed, actionable study plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "Unable to generate study plan at this time.";
  } catch (error) {
    console.error("Error generating study plan:", error);
    return "Unable to generate study plan. Please try again later.";
  }
}
