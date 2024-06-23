import OpenAI from 'openai';

// Configure the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const generateQuizQuestions = async (transcript) => {
  console.log(transcript);
  const transcriptStr = JSON.stringify(transcript);
  const prompt = `
  Generate a list of quiz questions from the following transcript. Each question should be JSON formatted with a question, four answer choices, a correct answer, and a timestamp when the question should be asked based on the timestamps of the transcript. The timestamps should be whole numbers representing when the question should be asked after the video goes over that topic. The offsets in the transcript represent the time in seconds into the video that the specified sentence started being said. Randomly choose a number between 15 to 20 seconds and add it to each timestamp. The questions should be on important details and should not be generated for every small topic. A good reference is no more than 3 questions for a 5-minute video. A 30-minute video can have around 10 questions.

  Transcript:
  ${transcriptStr}

  Example JSON format:
  {
    "questions":[
        {
        "question": "What is the capital of France?",
        "answers": [
            "London",
            "Paris",
            "Berlin",
            "Rome"
        ],
        "correct_answer": "Paris",
        "timestamp": 30
        },
        {
        "question": "Who painted the Mona Lisa?",
        "answers": [
            "Leonardo da Vinci",
            "Pablo Picasso",
            "Vincent van Gogh",
            "Claude Monet"
        ],
        "correct_answer": "Leonardo da Vinci",
        "timestamp": 60
        }
    ]
  }

  JSON:
  `;
  console.log(prompt);
  try {
    const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant designed to generate quizzes and output them in JSON.",
          },
          { role: "user", content: prompt },
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" },
      });

    const quizQuestions = JSON.parse(response.choices[0].message.content.trim());
    console.log(quizQuestions);
    return quizQuestions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return [];
  }
};