require("dotenv").config();

const { analyzeComplaint } = require("./services/geminiService");

const test = async () => {
  try {
    const result = await analyzeComplaint(
      "There is a blocked drainage channel on our street."
    );

    console.log("Gemini response:");
    console.log(result);
  } catch (error) {
    console.error("Gemini test failed:");
    console.error(error.message);
  }
};

test();